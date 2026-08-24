import { prisma } from "@/lib/prisma"
import { Prisma, type StatusDispatch } from "@/generated/prisma/client"
import type { AppUser } from "@/lib/auth"
import { fail } from "@/lib/response"
import { TOLERANSI_SELISIH } from "@/lib/constants"

/**
 * State machine dispatch — PRD §8.2 [WAJIB].
 *
 * "Hanya transisi di tabel ini diizinkan; lainnya -> HTTP 409", dan
 * "implementasikan sebagai transisiDispatch() tunggal". Semua efek stock
 * (reservasi BR-12, pengurangan BR-11) dan AuditLog (BR-14) terjadi di sini,
 * dalam satu transaksi.
 */

type Pelaku = "ADMIN" | "PETUGAS_PEMILIK"

type Transisi = { dari: StatusDispatch; ke: StatusDispatch; pelaku: Pelaku }

/** Tabel resmi §8.2. Urutan mengikuti PRD supaya mudah dibandingkan. */
const TRANSISI: readonly Transisi[] = [
  { dari: "DRAFT", ke: "DISPATCHED", pelaku: "ADMIN" },
  { dari: "DRAFT", ke: "DIBATALKAN", pelaku: "ADMIN" },
  { dari: "DISPATCHED", ke: "DITERIMA", pelaku: "PETUGAS_PEMILIK" },
  { dari: "DISPATCHED", ke: "DITOLAK", pelaku: "PETUGAS_PEMILIK" },
  { dari: "DISPATCHED", ke: "DIBATALKAN", pelaku: "ADMIN" },
  { dari: "DITOLAK", ke: "DRAFT", pelaku: "ADMIN" },
  { dari: "DITOLAK", ke: "DIBATALKAN", pelaku: "ADMIN" },
  { dari: "DITERIMA", ke: "SERAH_TERIMA", pelaku: "PETUGAS_PEMILIK" },
  { dari: "DITERIMA", ke: "DIBATALKAN", pelaku: "ADMIN" },
  { dari: "SERAH_TERIMA", ke: "SELESAI", pelaku: "ADMIN" },
]

/**
 * Status yang menahan reservasi stock (BR-12). Meninggalkan status ini ke
 * DITOLAK/DIBATALKAN wajib melepas reservasi; ke SERAH_TERIMA reservasi
 * dipakai lalu dilepas bersamaan dengan pengurangan berat.
 */
const MENAHAN_RESERVASI: readonly StatusDispatch[] = ["DISPATCHED", "DITERIMA"]

export type BeratAktualInput = { dispatchItemId: string; beratAktual: number }

export type TransisiInput = {
  id: string
  ke: StatusDispatch
  user: AppUser
  /** Wajib untuk DITOLAK (§8.2). */
  alasanTolak?: string
  /** Wajib untuk SERAH_TERIMA: semua item harus terisi. */
  beratAktual?: BeratAktualInput[]
  /** Wajib kalau selisih melewati TOLERANSI_SELISIH. */
  alasanSelisih?: string
  /** Wajib untuk SELESAI: nilai penjualan terisi. */
  totalNilai?: number
}

export type TransisiHasil =
  | { ok: true; dispatch: Awaited<ReturnType<typeof ambilDispatch>> }
  | { ok: false; response: Response }

const dispatchInclude = {
  bankSampah: { select: { id: true, nama: true } },
  pembeli: { select: { id: true, nama: true } },
  items: { include: { jenisSampah: { select: { id: true, nama: true } } } },
} satisfies Prisma.DispatchInclude

function ambilDispatch(id: string) {
  return prisma.dispatch.findFirst({
    where: { id, deletedAt: null },
    include: dispatchInclude,
  })
}

function pelakuBoleh(pelaku: Pelaku, user: AppUser, bankSampahId: string): boolean {
  if (pelaku === "ADMIN") return user.role === "ADMIN"
  // "PETUGAS pemilik" = user.bankSampahId === dispatch.bankSampahId (§8.2)
  return user.role === "PETUGAS" && user.bankSampahId === bankSampahId
}

export async function transisiDispatch(input: TransisiInput): Promise<TransisiHasil> {
  const { id, ke, user } = input

  const dispatch = await ambilDispatch(id)
  if (!dispatch) {
    return { ok: false, response: fail("TIDAK_DITEMUKAN", "Dispatch tidak ditemukan") }
  }

  const aturan = TRANSISI.find((t) => t.dari === dispatch.status && t.ke === ke)
  if (!aturan) {
    return {
      ok: false,
      response: fail(
        "TRANSISI_TIDAK_VALID",
        `Transisi ${dispatch.status} -> ${ke} tidak diizinkan`,
      ),
    }
  }

  if (!pelakuBoleh(aturan.pelaku, user, dispatch.bankSampahId)) {
    const siapa =
      aturan.pelaku === "ADMIN" ? "ADMIN" : "PETUGAS pemilik bank sampah ini"
    return { ok: false, response: fail("AKSES_DITOLAK", `Transisi ini hanya untuk ${siapa}`) }
  }

  // --- syarat per transisi ---

  if (ke === "DITOLAK" && !input.alasanTolak?.trim()) {
    return {
      ok: false,
      response: fail("VALIDASI_GAGAL", "Alasan penolakan wajib", { field: "alasanTolak" }),
    }
  }

  if (ke === "SELESAI") {
    const nilai = input.totalNilai ?? (dispatch.totalNilai ? Number(dispatch.totalNilai) : 0)
    if (!nilai || nilai <= 0) {
      return {
        ok: false,
        response: fail("VALIDASI_GAGAL", "Nilai penjualan wajib terisi", {
          field: "totalNilai",
        }),
      }
    }
  }

  let beratPerItem: Map<string, Prisma.Decimal> | null = null
  let adaSelisihSignifikan = false

  if (ke === "SERAH_TERIMA") {
    const masuk = new Map((input.beratAktual ?? []).map((b) => [b.dispatchItemId, b]))
    if (masuk.size !== dispatch.items.length) {
      return {
        ok: false,
        response: fail("VALIDASI_GAGAL", "Berat aktual wajib terisi untuk semua item", {
          field: "beratAktual",
        }),
      }
    }
    beratPerItem = new Map()
    for (const item of dispatch.items) {
      const b = masuk.get(item.id)
      if (!b) {
        return {
          ok: false,
          response: fail("VALIDASI_GAGAL", "Berat aktual wajib terisi untuk semua item", {
            field: "beratAktual",
          }),
        }
      }
      const aktual = new Prisma.Decimal(b.beratAktual)
      if (aktual.lte(0)) {
        return {
          ok: false,
          response: fail("VALIDASI_GAGAL", "Berat aktual harus > 0", {
            field: "beratAktual",
          }),
        }
      }
      beratPerItem.set(item.id, aktual)

      // Selisih > TOLERANSI_SELISIH menandai dispatch untuk direview admin.
      const target = item.beratTarget
      const selisih = aktual.sub(target).abs().div(target).toNumber()
      if (selisih > TOLERANSI_SELISIH) adaSelisihSignifikan = true
    }

    if (adaSelisihSignifikan && !input.alasanSelisih?.trim()) {
      return {
        ok: false,
        response: fail(
          "VALIDASI_GAGAL",
          `Selisih melebihi ${TOLERANSI_SELISIH * 100}%, alasan wajib`,
          { field: "alasanSelisih" },
        ),
      }
    }
  }

  // Reservasi stock saat terbitkan (BR-12) — dicek sebelum transaksi supaya
  // pesan errornya bisa menyebut angka yang tepat.
  if (ke === "DISPATCHED") {
    for (const item of dispatch.items) {
      const stock = await prisma.stock.findUnique({
        where: {
          bankSampahId_jenisSampahId: {
            bankSampahId: dispatch.bankSampahId,
            jenisSampahId: item.jenisSampahId,
          },
        },
        select: { berat: true, beratReservasi: true },
      })
      const tersedia = stock
        ? stock.berat.sub(stock.beratReservasi)
        : new Prisma.Decimal(0)
      if (tersedia.lt(item.beratTarget)) {
        return {
          ok: false,
          response: fail(
            "STOCK_TIDAK_CUKUP",
            `Stock ${item.jenisSampah.nama} tersedia ${tersedia.toFixed(2)} kg, diminta ${item.beratTarget.toFixed(2)} kg`,
            { field: "items" },
          ),
        }
      }
    }
  }

  const sebelum = JSON.parse(JSON.stringify(dispatch))

  const hasil = await prisma.$transaction(async (tx) => {
    const dataUpdate: Prisma.DispatchUpdateInput = { status: ke }

    if (ke === "DITOLAK") dataUpdate.alasanTolak = input.alasanTolak?.trim()
    if (ke === "DRAFT") dataUpdate.alasanTolak = null
    if (ke === "SELESAI" && input.totalNilai != null) {
      dataUpdate.totalNilai = new Prisma.Decimal(input.totalNilai)
    }

    if (ke === "DISPATCHED") {
      for (const item of dispatch.items) {
        await tx.stock.update({
          where: {
            bankSampahId_jenisSampahId: {
              bankSampahId: dispatch.bankSampahId,
              jenisSampahId: item.jenisSampahId,
            },
          },
          data: { beratReservasi: { increment: item.beratTarget } },
        })
      }
    }

    // Melepas reservasi tanpa mengurangi berat: tidak ada StockMutation karena
    // StockMutation mencatat pergerakan berat, dan berat tidak berubah di sini.
    if (
      MENAHAN_RESERVASI.includes(dispatch.status) &&
      (ke === "DITOLAK" || ke === "DIBATALKAN")
    ) {
      for (const item of dispatch.items) {
        await tx.stock.update({
          where: {
            bankSampahId_jenisSampahId: {
              bankSampahId: dispatch.bankSampahId,
              jenisSampahId: item.jenisSampahId,
            },
          },
          data: { beratReservasi: { decrement: item.beratTarget } },
        })
      }
    }

    if (ke === "SERAH_TERIMA" && beratPerItem) {
      let totalNilai = new Prisma.Decimal(0)

      for (const item of dispatch.items) {
        const aktual = beratPerItem.get(item.id)
        if (!aktual) throw new Error("berat aktual hilang setelah divalidasi")
        const subtotal = aktual.mul(item.hargaJualPerKg)
        totalNilai = totalNilai.add(subtotal)

        await tx.dispatchItem.update({
          where: { id: item.id },
          data: { beratAktual: aktual, subtotal },
        })

        const stock = await tx.stock.findUnique({
          where: {
            bankSampahId_jenisSampahId: {
              bankSampahId: dispatch.bankSampahId,
              jenisSampahId: item.jenisSampahId,
            },
          },
          select: { id: true, berat: true },
        })
        if (!stock) throw new Error("stock tidak ditemukan saat serah terima")

        const beratSebelum = stock.berat
        const beratSesudah = beratSebelum.sub(aktual)
        // BR-07: stock tidak boleh minus.
        if (beratSesudah.lt(0)) {
          throw new StockMinusError(item.jenisSampah.nama, beratSebelum, aktual)
        }

        // BR-11 + BR-12 atomik: berat berkurang, reservasi dilepas.
        await tx.stock.update({
          where: { id: stock.id },
          data: {
            berat: beratSesudah,
            beratReservasi: { decrement: item.beratTarget },
          },
        })

        await tx.stockMutation.create({
          data: {
            stockId: stock.id,
            tipe: "KELUAR",
            berat: aktual,
            beratSebelum,
            beratSesudah,
            refType: "DISPATCH",
            refId: dispatch.id,
            userId: user.id,
            keterangan: `Serah terima ${dispatch.kodeDispatch}`,
          },
        })
      }

      dataUpdate.totalNilai = totalNilai
      dataUpdate.selisihSignifikan = adaSelisihSignifikan
      if (input.alasanSelisih?.trim()) dataUpdate.alasanSelisih = input.alasanSelisih.trim()
    }

    const diperbarui = await tx.dispatch.update({
      where: { id },
      data: dataUpdate,
      include: dispatchInclude,
    })

    // BR-14: setiap transisi wajib AuditLog dengan before/after.
    await tx.auditLog.create({
      data: {
        userId: user.id,
        aksi: `TRANSISI_DISPATCH_${ke}`,
        entitas: "Dispatch",
        entitasId: id,
        payloadBefore: sebelum,
        payloadAfter: JSON.parse(JSON.stringify(diperbarui)),
      },
    })

    return diperbarui
  })

  return { ok: true, dispatch: hasil }
}

/** Dilempar dari dalam transaksi supaya rollback, ditangkap di route handler. */
export class StockMinusError extends Error {
  constructor(
    readonly jenis: string,
    readonly tersedia: Prisma.Decimal,
    readonly diminta: Prisma.Decimal,
  ) {
    super(
      `Stock ${jenis} tersedia ${tersedia.toFixed(2)} kg, diminta ${diminta.toFixed(2)} kg`,
    )
    this.name = "StockMinusError"
  }
}
