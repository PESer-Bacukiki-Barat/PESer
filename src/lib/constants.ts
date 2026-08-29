/**
 * Konstanta wajib PRD §8.7 — "tidak angka ajaib; semua di lib/constants.ts".
 * Nilainya diambil apa adanya dari PRD, jangan diubah tanpa memperbarui PRD.
 */

/** Batas selisih berat aktual vs target sebelum dianggap signifikan (5%). */
export const TOLERANSI_SELISIH = 0.05

/** Pembulatan pembayaran tunai ke warga, dalam rupiah. */
export const PEMBULATAN_TUNAI = 500

/** Jumlah desimal berat (kg) — sejalan dengan Decimal(10,2), BR-08. */
export const DESIMAL_BERAT = 2

/** Lama draft offline disimpan sebelum dibuang. */
export const RETENSI_DRAFT_HARI = 7

/** Ukuran minimum target sentuh di UI mobile, dalam piksel. */
export const TARGET_SENTUH_MIN_PX = 44

/** Jumlah notifikasi terbaru yang ditarik lonceng sekali muat (FR-E5). */
export const BATAS_NOTIFIKASI = 20

/**
 * Jeda polling notifikasi, dalam milidetik.
 *
 * PRD §4.2 menetapkan notifikasi ditarik dari DB tanpa broker dan tanpa cron,
 * jadi kesegarannya dibatasi jeda ini. 60 detik: cukup cepat untuk "stock
 * lewat ambang" dan "dispatch masuk" yang keduanya bukan kejadian per detik,
 * dan cukup jarang agar tidak membebani perangkat petugas di lapangan.
 */
export const JEDA_POLL_NOTIFIKASI_MS = 60_000

/**
 * Foto bukti serah terima — FR-D5 / BR-19.
 *
 * Nilai yang sama ditegakkan CHECK constraint di migration
 * 20260829120000_add_gerbang_kualitas_dan_foto_bukti: validasi aplikasi bisa
 * dilewati skrip atau perbaikan manual, CHECK tidak.
 */
export const MAKS_UKURAN_FOTO_BYTE = 1_048_576 // 1 MB

/** Sisi terpanjang setelah kompresi di klien, dalam piksel. */
export const MAKS_DIMENSI_FOTO_PX = 1600

/** Mutu JPEG hasil kompresi klien. 0,8 sudah tak terbedakan untuk bukti foto. */
export const MUTU_KOMPRESI_FOTO = 0.8

export const TIPE_FOTO_DIIZINKAN = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const
