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
