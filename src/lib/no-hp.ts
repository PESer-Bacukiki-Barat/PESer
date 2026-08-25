/**
 * Normalisasi nomor HP.
 *
 * Murni, tanpa Prisma, karena dipakai di tiga tempat sekaligus: zod schema
 * `/api/users` (validasi), `src/lib/nasabah-tertaut.ts` (pencocokan), dan form
 * admin di browser. Pola yang sama dengan `dispatch-aksi.ts` — tabel/aturan
 * murni dipisah dari modul yang menyentuh database.
 */

/** Minimal angka supaya sebuah nomor bisa mengidentifikasi satu orang. */
export const MIN_DIGIT_NOHP = 8

/**
 * Bentuk nomor HP yang bisa dibandingkan.
 *
 * Nomor diketik manusia di dua tempat berbeda (form nasabah oleh petugas, form
 * akun oleh admin), jadi "0812-3450-0001", "+62 812 3450 0001", dan
 * "081234500001" harus dianggap sama. Tanpa ini penautan akun→nasabah gagal
 * tanpa jejak dan warga hanya melihat "belum terdaftar" tanpa sebab.
 *
 * Mengembalikan null kalau tidak cukup angka untuk mengidentifikasi siapa pun —
 * "-" atau "0" tidak boleh menjadi kunci yang cocok dengan banyak orang.
 */
export function normalkanNoHp(raw: string | null | undefined): string | null {
  if (!raw) return null
  const angka = raw.replace(/\D/g, "")
  if (angka.length < MIN_DIGIT_NOHP) return null

  // Kode negara Indonesia disamakan dengan bentuk lokal berawalan 0.
  if (angka.startsWith("62")) return `0${angka.slice(2)}`
  // Nomor seluler yang diketik tanpa 0 di depan ("81234...").
  if (angka.startsWith("8")) return `0${angka}`
  return angka
}
