import { z } from "zod"

export const nasabahSchema = z.object({
  kodeNasabah: z.string().trim().min(1, "kodeNasabah wajib"),
  bankSampahId: z.string().trim().min(1, "bankSampahId wajib"),
  nama: z.string().trim().min(1, "nama wajib"),
  noHp: z.string().trim().optional(),
  alamat: z.string().trim().min(1, "alamat wajib"),
  rt: z.string().trim().min(1, "rt wajib"),
  rw: z.string().trim().min(1, "rw wajib"),
  isActive: z.boolean().optional().default(true),
})
