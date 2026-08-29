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

/**
 * Satu baris penolakan gerbang kualitas — FR-C2, BR-18.
 *
 * `jenisSampahId` opsional dengan sengaja: salah satu alasan penolakan justru
 * "tidak ada di master jenis", dan memaksa memilih jenis akan membuat kasus itu
 * mustahil dicatat. `deskripsi` yang selalu wajib menggantikan perannya.
 *
 * Tidak ada `subtotal` atau `harga` di sini karena barang tolakan tidak dibayar
 * sama sekali (BR-18).
 */
export const setoranDitolakSchema = z
  .object({
    jenisSampahId: z.string().trim().min(1).optional(),
    deskripsi: z.string().trim().min(1, "deskripsi barang yang ditolak wajib"),
    berat: z.coerce.number().positive("berat harus > 0"),
    alasan: z.enum([
      "TIDAK_TERSORTIR",
      "TIDAK_SESUAI_MASTER",
      "TERKONTAMINASI",
      "LAINNYA",
    ]),
    catatan: z.string().trim().min(1).optional(),
  })
  .refine((d) => d.alasan !== "LAINNYA" || !!d.catatan, {
    message: "catatan wajib diisi kalau alasannya Lainnya",
    path: ["catatan"],
  })

export const setoranSchema = z
  .object({
    nasabahId: z.string().trim().min(1, "nasabahId wajib"),
    tanggal: z.coerce.date().optional(),
    cashDibayar: z.boolean().optional().default(false),
    // Boleh kosong: PRD §4.1 mengizinkan kunjungan yang SELURUH barangnya
    // ditolak. Yang dilarang adalah setoran tanpa item DAN tanpa penolakan —
    // itu bukan kunjungan, hanya baris kosong.
    items: z.array(setoranItemSchema).default([]),
    ditolak: z.array(setoranDitolakSchema).default([]),
  })
  .refine((d) => d.items.length > 0 || d.ditolak.length > 0, {
    message: "setoran harus punya minimal 1 item diterima atau 1 penolakan",
    path: ["items"],
  })

/** Query GET /api/setoran — filter tanggal inklusif. */
export const setoranQuerySchema = z.object({
  dari: z.coerce.date().optional(),
  sampai: z.coerce.date().optional(),
})

export type SetoranSchema = z.infer<typeof setoranSchema>
export type SetoranItemSchema = z.infer<typeof setoranItemSchema>
export type SetoranDitolakSchema = z.infer<typeof setoranDitolakSchema>
