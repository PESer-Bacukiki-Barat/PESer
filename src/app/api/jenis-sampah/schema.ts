import { z } from "zod"

export const jenisSampahSchema = z.object({
  kode: z.number().int().positive("kode wajib"),
  nama: z.string().trim().min(1, "nama wajib"),
  kategori: z.string().trim().default("PLASTIK"),
  satuan: z.string().trim().default("KG"),
  deskripsi: z.string().trim().optional(),
  isActive: z.boolean().optional().default(true),
})
