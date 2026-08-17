import { z } from "zod"

export const bankSampahSchema = z.object({
  nama: z.string().trim().min(1, "nama wajib"),
  kelurahanId: z.string().trim().min(1, "kelurahanId wajib"),
  alamat: z.string().trim().min(1, "alamat wajib"),
  latitude: z.number(),
  longitude: z.number(),
  isActive: z.boolean().optional().default(true),
})
