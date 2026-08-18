import { z } from "zod"

export const pembeliSchema = z.object({
  nama: z.string().trim().min(1, "nama wajib"),
  perusahaan: z.string().trim().optional(),
  noHp: z.string().trim().min(1, "noHp wajib"),
  alamat: z.string().trim().min(1, "alamat wajib"),
  catatan: z.string().trim().optional(),
  isActive: z.boolean().optional().default(true),
})
