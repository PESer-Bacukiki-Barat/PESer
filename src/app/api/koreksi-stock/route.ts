import { prisma } from "@/lib/prisma"
import { koreksiStockSchema } from "./schema"
import { requireAuth } from "@/lib/auth"
import { ok, created, fail, failValidation } from "@/lib/response"

export async function GET() {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  const where =
    auth.user.role === "PETUGAS"
      ? { stock: { bankSampahId: auth.user.bankSampah?.id } }
      : {}
  const data = await prisma.koreksiStock.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    // Tanpa relasi ini riwayat hanya berisi id, jadi tidak bisa dibaca
    // manusia — padahal FR-C8 justru tentang membacanya.
    include: {
      dilakukanOleh: { select: { nama: true } },
      stock: {
        select: {
          jenisSampah: { select: { nama: true } },
          bankSampah: { select: { nama: true } },
        },
      },
    },
  })
  return ok(data)
}

export async function POST(request: Request) {
  const auth = await requireAuth("PETUGAS")
  if (!auth.ok) return auth.response
  const parsed = koreksiStockSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return failValidation(parsed.error.issues)
  }
  const { stockId, beratBaru, alasan } = parsed.data
  const bankSampahId = auth.user.bankSampah?.id
  if (!bankSampahId) {
    return fail("AKSES_DITOLAK", "Petugas belum ditugaskan ke bank sampah")
  }

  const stock = await prisma.stock.findFirst({ where: { id: stockId, bankSampahId } })
  if (!stock) return fail("TIDAK_DITEMUKAN", "Stock tidak ditemukan")

  // Koreksi tidak boleh turun di bawah berat yang sudah direservasi dispatch
  // berjalan (BR-12). Tanpa penjagaan ini stock tersedia jadi negatif dan
  // dispatch memegang klaim atas barang yang tidak ada lagi.
  const reservasi = stock.beratReservasi.toNumber()
  if (beratBaru < reservasi) {
    return fail(
      "STOCK_TIDAK_CUKUP",
      `${reservasi.toFixed(2)} kg sedang direservasi dispatch, koreksi tidak boleh di bawah itu`,
      { field: "beratBaru" },
    )
  }

  const beratLama = stock.berat.toNumber()
  const selisih = beratBaru - beratLama

  try {
    const koreksi = await prisma.$transaction(async (tx) => {
      await tx.stock.update({ where: { id: stockId }, data: { berat: beratBaru } })
      const created = await tx.koreksiStock.create({
        data: {
          stockId,
          beratSebelum: beratLama,
          beratSesudah: beratBaru,
          alasan,
          dilakukanOlehId: auth.user.id,
        },
      })
      await tx.stockMutation.create({
        data: {
          stockId,
          tipe: "ADJUST",
          berat: selisih,
          beratSebelum: beratLama,
          beratSesudah: beratBaru,
          refType: "KOREKSI_STOCK",
          refId: created.id,
          userId: auth.user.id,
          keterangan: alasan,
        },
      })
      await tx.auditLog.create({
        data: {
          userId: auth.user.id,
          aksi: "KOREKSI_STOCK",
          entitas: "Stock",
          entitasId: stockId,
          payloadBefore: { berat: beratLama.toString() },
          payloadAfter: { berat: beratBaru.toString() },
        },
      })
      return created
    })
    return created(koreksi)
  } catch {
    return fail("PERMINTAAN_GAGAL", "gagal menyimpan koreksi stock")
  }
}
