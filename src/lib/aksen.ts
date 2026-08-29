/**
 * Aksen warna untuk kartu ringkasan dan penanda kategori.
 *
 * Tujuannya membuat mata bisa membedakan jenis informasi sekilas, bukan
 * membuat layar berwarna-warni. Karena itu:
 *
 * - Semuanya diambil dari palet DESIGN.md yang sudah ada (primary, secondary,
 *   tertiary, error), bukan warna baru. Palet itu sudah dipasangkan dengan
 *   warna teksnya masing-masing, jadi kontrasnya terjaga di terang dan gelap.
 * - Warna hanya dipakai pada CHIP IKON, bukan pada angka atau latar kartu.
 *   Angka tetap `text-on-surface` supaya yang paling penting di kartu tetap
 *   yang paling mudah dibaca, dan supaya deretan kartu tidak berubah jadi
 *   pelangi.
 * - Setiap warna punya arti tetap di seluruh aplikasi (lihat di bawah), jadi
 *   ia menjadi isyarat yang bisa dipelajari — bukan hiasan.
 *
 * Warna TIDAK PERNAH jadi satu-satunya pembeda: setiap kartu tetap punya label
 * teks dan ikon sendiri, sehingga tetap terbaca oleh pengguna buta warna.
 */
export type NamaAksen = "tempat" | "orang" | "barang" | "gerak" | "perhatian"

export const AKSEN: Record<NamaAksen, string> = {
  /** Lokasi fisik: bank sampah, kelurahan, peta. */
  tempat: "bg-primary-container text-on-primary-container",
  /** Manusia: nasabah, petugas, pembeli. */
  orang: "bg-secondary-container text-on-secondary-container",
  /** Benda & katalog: jenis sampah, stock. */
  barang: "bg-tertiary-container text-on-tertiary-container",
  /** Perpindahan: dispatch, setoran, mutasi. */
  gerak: "bg-primary-container text-on-primary-container",
  /** Butuh tindakan atau bermasalah. */
  perhatian: "bg-error-container text-on-error-container",
}
