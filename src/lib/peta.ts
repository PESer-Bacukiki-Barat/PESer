import { prisma } from "@/lib/prisma"
import { levelStock, type MarkerBankSampah } from "@/lib/level-stock"

/**
 * Data marker peta — FR-E2.
 *
 * Query dan agregasinya di satu tempat supaya peta admin (semua bank sampah)
 * dan peta petugas (bank sampahnya sendiri) menghitung level dengan cara yang
 * persis sama. Yang membedakan hanya filternya, dan filter itu datang dari
 * pemanggil — bukan dari isi permintaan.
 */
export async function markerBankSampah(
  bankSampahId?: string,
): Promise<MarkerBankSampah[]> {
  const rows = await prisma.bankSampah.findMany({
    where: {
      deletedAt: null,
      ...(bankSampahId ? { id: bankSampahId } : {}),
    },
    orderBy: { nama: "asc" },
    select: {
      id: true,
      nama: true,
      alamat: true,
      latitude: true,
      longitude: true,
      isActive: true,
      kelurahan: { select: { nama: true } },
      stock: { select: { berat: true, threshold: true } },
    },
  })

  return rows.map((b) => {
    const berat = b.stock.reduce((a, s) => a + Number(s.berat), 0)
    const threshold = b.stock.reduce((a, s) => a + Number(s.threshold), 0)
    return {
      id: b.id,
      nama: b.nama,
      kelurahan: b.kelurahan?.nama ?? null,
      alamat: b.alamat,
      // Decimal Prisma tidak serializable ke Client Component.
      latitude: Number(b.latitude),
      longitude: Number(b.longitude),
      isActive: b.isActive,
      berat: Math.round(berat * 100) / 100,
      threshold: Math.round(threshold * 100) / 100,
      level: levelStock({ berat, threshold }),
    }
  })
}
