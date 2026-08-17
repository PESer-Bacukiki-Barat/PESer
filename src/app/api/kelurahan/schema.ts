import { z } from "zod"

export const kelurahanSchema = z.object({
  nama: z.string().trim().min(1, "nama wajib"),
  kodeWilayah: z.string().trim().min(1, "kodeWilayah wajib"),
})
