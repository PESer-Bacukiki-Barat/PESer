import { z } from "zod"

export const koreksiStockSchema = z.object({
  stockId: z.string().min(1, "stockId wajib"),
  beratBaru: z.number().min(0, "berat tidak boleh negatif"),
  alasan: z.string().trim().min(1, "alasan wajib"),
})
