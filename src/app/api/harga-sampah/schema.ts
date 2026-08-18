import { z } from "zod"

export const hargaSampahSchema = z.object({
  jenisSampahId: z.string().trim().min(1, "jenisSampahId wajib"),
  hargaBeli: z.number(),
  hargaJual: z.number(),
  berlakuMulai: z.coerce.date(),
  berlakuSampai: z.coerce.date().optional(),
})
