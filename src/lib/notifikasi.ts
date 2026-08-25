import type { Prisma } from "@/generated/prisma/client"

/**
 * Notifikasi in-app — FR-E5.
 *
 * PRD §4.2 (Arsitektur): tidak ada message broker; notifikasi disimpan di DB
 * lalu ditarik aplikasi, tanpa cron (BR-06). Karena itu "mengirim" di sini
 * berarti menulis baris — dan penulisannya menerima client transaksi, bukan
 * prisma global, supaya notifikasi tidak pernah muncul untuk setoran atau
 * dispatch yang ternyata gagal.
 *
 * Penerima diselesaikan saat penulisan (satu baris per akun) karena PRD
 * menyebut penerimanya sebagai peran — "notifikasi ke Admin", "push notif ke
 * petugas pemilik" — bukan satu akun tertentu. Lihat komentar model Notifikasi.
 */

/**
 * Apakah penambahan stock ini MELEWATI ambang, bukan sekadar berada di atasnya?
 *
 * Murni supaya bisa diuji tanpa database, dan dipisah karena inilah satu-satunya
 * hal yang menentukan notifikasi ini berguna atau jadi kebisingan. PRD §8
 * (Keputusan Terbuka baris 1028) mencatat risikonya sebagai "notifikasi
 * kebanyakan/never": tanpa syarat "melewati", setiap setoran berikutnya di
 * gudang yang sudah penuh akan mengirim notifikasi baru, dan admin berhenti
 * membacanya.
 *
 * threshold <= 0 berarti ambangnya belum diatur — tidak ada dasar untuk
 * memberi tahu siapa pun. Aturan yang sama dipakai peta (src/lib/level-stock.ts).
 */
export function melewatiThreshold({
  sebelum,
  sesudah,
  threshold,
}: {
  sebelum: number
  sesudah: number
  threshold: number
}): boolean {
  if (threshold <= 0) return false
  return sebelum < threshold && sesudah >= threshold
}

const fmtBerat = (n: number) =>
  new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(n)

/**
 * Stock satu jenis melewati ambang jemput — AC PRD baris 313:
 * "Given total stock melewati threshold, When setoran selesai, Then notifikasi
 * terkirim ke Admin."
 *
 * Semua ADMIN aktif diberi tahu. Admin tidak punya lingkup satu bank sampah
 * (§5.3), jadi tidak ada penyaringan lain selain peran.
 */
export async function notifStockThreshold(
  tx: Prisma.TransactionClient,
  data: {
    bankSampahId: string
    namaBankSampah: string
    namaJenis: string
    berat: number
    threshold: number
  },
): Promise<number> {
  const admin = await tx.user.findMany({
    where: { role: "ADMIN", isActive: true, deletedAt: null },
    select: { id: true },
  })
  if (admin.length === 0) return 0

  await tx.notifikasi.createMany({
    data: admin.map((a) => ({
      userId: a.id,
      tipe: "STOCK_THRESHOLD" as const,
      judul: `${data.namaBankSampah} siap dijemput`,
      pesan:
        `${data.namaJenis} mencapai ${fmtBerat(data.berat)} kg, melewati ambang ` +
        `${fmtBerat(data.threshold)} kg.`,
      tautan: "/admin/peta",
      bankSampahId: data.bankSampahId,
    })),
  })
  return admin.length
}

/**
 * Dispatch diterbitkan ke sebuah bank sampah — diagram urutan §6:
 * `TD->>N: push notif ke petugas pemilik` pada transisi DRAFT → DISPATCHED.
 *
 * "PETUGAS pemilik" didefinisikan §6 sebagai `user.bankSampahId ===
 * dispatch.bankSampahId`, jadi itu persis penyaringnya.
 */
export async function notifDispatchMasuk(
  tx: Prisma.TransactionClient,
  data: { bankSampahId: string; dispatchId: string; kodeDispatch: string },
): Promise<number> {
  const petugas = await tx.user.findMany({
    where: {
      role: "PETUGAS",
      bankSampahId: data.bankSampahId,
      isActive: true,
      deletedAt: null,
    },
    select: { id: true },
  })
  if (petugas.length === 0) return 0

  await tx.notifikasi.createMany({
    data: petugas.map((p) => ({
      userId: p.id,
      tipe: "DISPATCH_MASUK" as const,
      judul: `Dispatch ${data.kodeDispatch} masuk`,
      pesan: "Ada penjemputan baru untuk bank sampah Anda. Periksa dan konfirmasi.",
      tautan: `/petugas/dispatch/${data.dispatchId}`,
      bankSampahId: data.bankSampahId,
    })),
  })
  return petugas.length
}
