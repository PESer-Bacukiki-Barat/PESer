import { prisma } from "@/lib/prisma"
import { Prisma } from "@/generated/prisma/client"
import { requireAuth } from "@/lib/auth"
import { scopeToBankSampah } from "@/lib/scope"
import { ok, created, fail, failValidation } from "@/lib/response"
import { melewatiThreshold, notifStockThreshold } from "@/lib/notifikasi"
import { setoranSchema, setoranQuerySchema } from "./schema"

const HEADER_IDEMPOTENCY = "Idempotency-Key"

/** Bentuk yang dikirim balik sebagai bukti setor. */
const setoranInclude = {
  nasabah: { select: { id: true, kodeNasabah: true, nama: true } },
  petugas: { select: { id: true, nama: true } },
  bankSampah: { select: { id: true, nama: true } },
  items: { include: { jenisSampah: { select: { id: true, nama: true } } } },
} satisfies Prisma.SetoranInclude

/**
 * GET /api/setoran — riwayat setoran (FR-C9).
 * Petugas hanya melihat bank sampahnya sendiri, admin melihat semuanya.
 */
export async function GET(request: Request) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  const url = new URL(request.url)
  const parsed = setoranQuerySchema.safeParse({
    dari: url.searchParams.get("dari") ?? undefined,
    sampai: url.searchParams.get("sampai") ?? undefined,
  })
  if (!parsed.success) return failValidation(parsed.error.issues)

  const where: Prisma.SetoranWhereInput = {}

  // Scope dari sesi, bukan dari query — PRD §2.5 aturan 4.
  if (auth.user.role === "PETUGAS") {
    const scope = scopeToBankSampah(auth.user)
    if (!scope.ok) return scope.response
    where.bankSampahId = scope.bankSampahId
  }

  const { dari, sampai } = parsed.data
  if (dari || sampai) {
    where.tanggal = { ...(dari && { gte: dari }), ...(sampai && { lte: sampai }) }
  }

  const data = await prisma.setoran.findMany({
    where,
    include: setoranInclude,
    orderBy: { tanggal: "desc" },
  })
  return ok(data)
}

/**
 * POST /api/setoran — FR-C1..C4, alur PRD §4.1, sequence §6.1.
 *
 * Satu transaksi atomik: Setoran + SetoranItem + Stock + StockMutation(MASUK)
 * + AuditLog. Stock tidak pernah diubah di luar transaksi yang juga menulis
 * StockMutation (larangan PRD §8.7).
 */
export async function POST(request: Request) {
  const auth = await requireAuth("PETUGAS")
  if (!auth.ok) return auth.response

  const scope = scopeToBankSampah(auth.user)
  if (!scope.ok) return scope.response
  const bankSampahId = scope.bankSampahId

  const idempotencyKey = request.headers.get(HEADER_IDEMPOTENCY)?.trim()
  if (!idempotencyKey) {
    return fail("VALIDASI_GAGAL", `Header ${HEADER_IDEMPOTENCY} wajib`, {
      field: HEADER_IDEMPOTENCY,
    })
  }

  const parsed = setoranSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return failValidation(parsed.error.issues)
  const { nasabahId, tanggal, cashDibayar, items } = parsed.data

  // Replay: request yang sama sudah pernah diproses. PRD §6.1 menetapkan
  // "kembalikan hasil lama", jadi yang dikirim adalah bukti setor sebelumnya.
  const sudahAda = await prisma.setoran.findUnique({
    where: { idempotencyKey },
    include: setoranInclude,
  })
  if (sudahAda) {
    const res = ok(sudahAda)
    // Kode DUPLIKAT_IDEMPOTENCY di tabel §2.5 dipetakan ke HTTP 200 padahal ia
    // kode error, sementara aturannya justru meminta hasil lama dikembalikan.
    // Bentuk sukses dipertahankan, penanda replay dikirim lewat header.
    res.headers.set("Idempotent-Replay", "true")
    return res
  }

  // Nasabah wajib milik bank sampah petugas ini — mencegah lintas bank sampah.
  const nasabah = await prisma.nasabah.findFirst({
    where: { id: nasabahId, bankSampahId, deletedAt: null, isActive: true },
    select: { id: true },
  })
  if (!nasabah) {
    return fail("TIDAK_DITEMUKAN", "Nasabah tidak ditemukan di bank sampah ini", {
      field: "nasabahId",
    })
  }

  const jenisIds = [...new Set(items.map((i) => i.jenisSampahId))]
  const jenisList = await prisma.jenisSampah.findMany({
    where: { id: { in: jenisIds }, deletedAt: null, isActive: true },
    select: { id: true, nama: true, harga: true },
  })
  const jenisById = new Map(jenisList.map((j) => [j.id, j]))

  if (jenisIds.some((id) => !jenisById.has(id))) {
    return fail("TIDAK_DITEMUKAN", "Jenis sampah tidak ditemukan atau tidak aktif", {
      field: "items",
    })
  }

  // BR-16: jenis sampah dengan harga 0 tidak boleh masuk setoran.
  const tanpaHarga = jenisList.find((j) => j.harga.lte(0))
  if (tanpaHarga) {
    return fail("HARGA_TIDAK_AKTIF", `${tanpaHarga.nama} belum punya harga aktif`, {
      field: "items",
    })
  }

  // BR-08/BR-09: hitung dengan Decimal, harga di-snapshot dari master.
  const rincian = items.map((item) => {
    const jenis = jenisById.get(item.jenisSampahId)
    if (!jenis) throw new Error("jenis sampah hilang setelah divalidasi")
    const berat = new Prisma.Decimal(item.berat)
    return {
      jenisSampahId: item.jenisSampahId,
      kondisi: item.kondisi,
      berat,
      hargaSaatItu: jenis.harga,
      subtotal: berat.mul(jenis.harga),
    }
  })

  const totalBerat = rincian.reduce((a, r) => a.add(r.berat), new Prisma.Decimal(0))
  const totalNilai = rincian.reduce((a, r) => a.add(r.subtotal), new Prisma.Decimal(0))
  const tanggalSetoran = tanggal ?? new Date()

  try {
    const hasil = await prisma.$transaction(async (tx) => {
      const bulan = `${tanggalSetoran.getFullYear()}${String(
        tanggalSetoran.getMonth() + 1,
      ).padStart(2, "0")}`
      // kodeTransaksi unik global, jadi nomor urut dihitung atas seluruh kode
      // berprefiks bulan yang sama — bukan per bank sampah, yang akan
      // menghasilkan SET-202608-001 di dua bank sampah sekaligus.
      // Tidak ada lubang nomor karena setoran tidak bisa dihapus (BR-10).
      const urutan = await tx.setoran.count({
        where: { kodeTransaksi: { startsWith: `SET-${bulan}-` } },
      })

      const setoran = await tx.setoran.create({
        data: {
          kodeTransaksi: `SET-${bulan}-${String(urutan + 1).padStart(3, "0")}`,
          bankSampahId,
          nasabahId,
          petugasId: auth.user.id,
          totalBerat,
          totalNilai,
          cashDibayar,
          tanggal: tanggalSetoran,
          idempotencyKey,
          items: { create: rincian },
        },
        include: setoranInclude,
      })

      for (const r of rincian) {
        const stockLama = await tx.stock.findUnique({
          where: {
            bankSampahId_jenisSampahId: {
              bankSampahId,
              jenisSampahId: r.jenisSampahId,
            },
          },
          select: { id: true, berat: true, threshold: true },
        })
        const beratSebelum = stockLama?.berat ?? new Prisma.Decimal(0)
        const beratSesudah = beratSebelum.add(r.berat)

        const stock = stockLama
          ? await tx.stock.update({
              where: { id: stockLama.id },
              data: { berat: beratSesudah },
              select: { id: true },
            })
          : await tx.stock.create({
              data: {
                bankSampahId,
                jenisSampahId: r.jenisSampahId,
                berat: beratSesudah,
              },
              select: { id: true },
            })

        await tx.stockMutation.create({
          data: {
            stockId: stock.id,
            tipe: "MASUK",
            berat: r.berat,
            beratSebelum,
            beratSesudah,
            refType: "SETORAN",
            refId: setoran.id,
            userId: auth.user.id,
            keterangan: `Setoran ${setoran.kodeTransaksi}`,
          },
        })

        // PRD §4.1 langkah 16: "Cek stock vs threshold -> lewat -> notifikasi
        // Admin". Syaratnya MELEWATI, bukan sekadar di atas ambang; lihat
        // melewatiThreshold() untuk alasannya.
        if (
          melewatiThreshold({
            sebelum: Number(beratSebelum),
            sesudah: Number(beratSesudah),
            threshold: Number(stockLama?.threshold ?? 0),
          })
        ) {
          await notifStockThreshold(tx, {
            bankSampahId,
            namaBankSampah: setoran.bankSampah.nama,
            namaJenis: jenisById.get(r.jenisSampahId)?.nama ?? "Stock",
            berat: Number(beratSesudah),
            threshold: Number(stockLama?.threshold ?? 0),
          })
        }
      }

      await tx.auditLog.create({
        data: {
          userId: auth.user.id,
          aksi: "BUAT_SETORAN",
          entitas: "Setoran",
          entitasId: setoran.id,
          payloadAfter: JSON.parse(JSON.stringify(setoran)),
        },
      })

      return setoran
    })

    return created(hasil)
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      // Tabrakan kodeTransaksi atau idempotencyKey karena request paralel.
      // Aman diulang klien: Idempotency-Key yang sama tidak akan menduplikasi.
      return fail("DUPLIKAT", "Setoran bertabrakan, silakan kirim ulang")
    }
    return fail("PERMINTAAN_GAGAL", "gagal menyimpan setoran")
  }
}
