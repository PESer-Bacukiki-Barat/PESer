import { z } from "zod"

/**
 * Body POST /api/setoran.
 *
 * Sengaja TIDAK menerima:
 * - `bankSampahId` — diambil dari sesi via scopeToBankSampah (§2.5 aturan 4).
 * - `hargaSaatItu` / `subtotal` / `totalNilai` — dihitung sistem dari
 *   JenisSampah.harga (BR-09: harga di-snapshot saat transaksi, dan PRD §4.1
 *   langkah 7 menegaskan sistem yang mengambil harga, bukan input petugas).
 * - `idempotencyKey` — dibaca dari header `Idempotency-Key`.
 */
export const setoranItemSchema = z.object({
  jenisSampahId: z.string().trim().min(1, "jenisSampahId wajib"),
  berat: z.coerce.number().positive("berat harus > 0"),
  kondisi: z.enum(["BERSIH", "KOTOR", "CAMPUR"]),
})

export const setoranSchema = z.object({
  nasabahId: z.string().trim().min(1, "nasabahId wajib"),
  tanggal: z.coerce.date().optional(),
  cashDibayar: z.boolean().optional().default(false),
  items: z.array(setoranItemSchema).min(1, "setidaknya 1 item"),
})

/** Query GET /api/setoran — filter tanggal inklusif. */
export const setoranQuerySchema = z.object({
  dari: z.coerce.date().optional(),
  sampai: z.coerce.date().optional(),
})

export type SetoranSchema = z.infer<typeof setoranSchema>
export type SetoranItemSchema = z.infer<typeof setoranItemSchema>
