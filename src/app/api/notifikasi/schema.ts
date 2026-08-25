import { z } from "zod"

import { BATAS_NOTIFIKASI } from "@/lib/constants"

/** Query GET /api/notifikasi. */
export const notifikasiQuerySchema = z.object({
  belumDibaca: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),
  batas: z.coerce.number().int().min(1).max(BATAS_NOTIFIKASI).optional(),
})

/**
 * Body POST /api/notifikasi/baca.
 *
 * `id` kosong berarti "tandai semua sudah dibaca" — tombol yang memang ada di
 * panel lonceng. Sengaja tidak menerima `userId`: cakupan diambil dari sesi
 * (§2.5 aturan 4), jadi tidak ada cara menandai notifikasi orang lain.
 */
export const bacaNotifikasiSchema = z.object({
  id: z.string().trim().min(1).optional(),
})

export type BacaNotifikasiSchema = z.infer<typeof bacaNotifikasiSchema>
