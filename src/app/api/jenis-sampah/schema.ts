import { z } from "zod"

export const jenisSampahSchema = z.object({
  kode: z.number().int().positive("kode wajib"),
  nama: z.string().trim().min(1, "nama wajib"),
  kategori: z.string().trim().default("PLASTIK"),
  satuan: z.string().trim().default("KG"),
  harga: z.number().min(0, "harga tidak boleh negatif").default(0),
  deskripsi: z.string().trim().optional(),
  isActive: z.boolean().optional().default(true),
})
