import { z } from "zod"

export const nasabahSchema = z.object({
  kodeNasabah: z.string().trim().min(1, "kodeNasabah wajib"),
  /**
   * Hanya dipakai ADMIN, yang tidak punya lingkup bank sampah tunggal (§5.3).
   * Untuk PETUGAS field ini DIABAIKAN dan lingkupnya diambil dari sesi —
   * §2.5 aturan 4: "Scope bank sampah tidak boleh diambil dari body request."
   * Karena itu optional di sini, dan route yang memutuskan nilainya.
   */
  bankSampahId: z.string().trim().min(1).optional(),
  nama: z.string().trim().min(1, "nama wajib"),
  noHp: z.string().trim().optional(),
  alamat: z.string().trim().min(1, "alamat wajib"),
  rt: z.string().trim().min(1, "rt wajib"),
  rw: z.string().trim().min(1, "rw wajib"),
  isActive: z.boolean().optional().default(true),
})
