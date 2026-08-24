import { z } from "zod"

/**
 * Body PATCH /api/profil — FR-A2 "Ubah profil & password sendiri".
 *
 * Sengaja TIDAK menerima:
 * - `role`, `bankSampahId`, `isActive` — kewenangan admin (FR-B3). Kalau
 *   diterima di sini, siapa pun bisa menaikkan perannya sendiri.
 * - `email` — itu identitas login (unique di User DAN Credential). Perubahannya
 *   tetap lewat admin supaya tidak ada akun yang kehilangan jalan masuk.
 * - `passwordHash` — hash dihitung server dari passwordBaru.
 */
export const profilSchema = z
  .object({
    nama: z.string().trim().min(1, "nama tidak boleh kosong").optional(),
    passwordLama: z.string().min(1, "password lama wajib").optional(),
    // Batas 6 karakter mengikuti userCreateSchema supaya konsisten.
    passwordBaru: z.string().min(6, "password baru minimal 6 karakter").optional(),
  })
  .refine((d) => !!d.passwordBaru === !!d.passwordLama, {
    message: "Password lama dan password baru harus diisi bersamaan",
    path: ["passwordLama"],
  })
  .refine((d) => !d.passwordBaru || d.passwordBaru !== d.passwordLama, {
    message: "Password baru harus berbeda dari password lama",
    path: ["passwordBaru"],
  })
  .refine((d) => d.nama !== undefined || d.passwordBaru !== undefined, {
    message: "Tidak ada yang diubah",
    path: ["nama"],
  })

export type ProfilSchema = z.infer<typeof profilSchema>
