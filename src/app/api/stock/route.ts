import { prisma } from "@/lib/prisma"
import { Prisma } from "@/generated/prisma/client"
import { requireAuth } from "@/lib/auth"
import { scopeToBankSampah } from "@/lib/scope"
import { ok } from "@/lib/response"

/**
 * GET /api/stock — FR-C5 (petugas: bank sampahnya sendiri) dan
 * FR-C6 (admin: semua bank sampah).
 *
 * Scope diambil dari sesi, bukan dari query — PRD §2.5 aturan 4. Tidak ada
 * endpoint tulis di sini: stock hanya berubah lewat transaksi yang sekaligus
 * menulis StockMutation (setoran, dispatch, koreksi) — larangan PRD §8.7.
 */
export async function GET() {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  const where: Prisma.StockWhereInput = {}
  if (auth.user.role === "PETUGAS") {
    const scope = scopeToBankSampah(auth.user)
    if (!scope.ok) return scope.response
    where.bankSampahId = scope.bankSampahId
  }

  const data = await prisma.stock.findMany({
    where,
    include: {
      bankSampah: { select: { id: true, nama: true } },
      jenisSampah: { select: { id: true, kode: true, nama: true, harga: true } },
    },
    orderBy: [{ bankSampahId: "asc" }, { jenisSampahId: "asc" }],
  })
  return ok(data)
}
