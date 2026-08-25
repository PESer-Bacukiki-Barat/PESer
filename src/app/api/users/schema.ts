import { z } from "zod"

import { normalkanNoHp } from "@/lib/no-hp"

/**
 * Nomor HP akun — jangkar penautan ke Nasabah di area warga
 * (`src/lib/nasabah-tertaut.ts`).
 *
 * Diletakkan di sini, BUKAN di /api/profil: nomor ini menentukan nasabah mana
 * yang diklaim sebuah akun, jadi kalau pemiliknya boleh mengubahnya sendiri ia
 * bisa menuliskan nomor warga lain dan membaca riwayat setoran orang itu.
 * Pengisiannya kewenangan ADMIN (FR-B3), sejalan dengan role dan bankSampahId.
 *
 * String kosong diterima sebagai null supaya form bisa mengosongkan nomor;
 * angka yang tidak cukup untuk mengidentifikasi siapa pun ditolak, karena
 * nomor yang "terisi tapi tidak pernah cocok" lebih membingungkan daripada
 * kolom kosong.
 */
const noHpSchema = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v))
  .refine((v) => v === null || normalkanNoHp(v) !== null, {
    message: "nomor HP tidak valid (minimal 8 angka)",
  })
  .nullish()

const petugasButuhBank = (data: { role?: string; bankSampahId?: string | null }) =>
  data.role !== "PETUGAS" || !!data.bankSampahId

export const userCreateSchema = z
  .object({
    email: z.string().trim().email("email tidak valid"),
    password: z.string().min(6, "password minimal 6 karakter"),
    nama: z.string().trim().min(1, "nama wajib"),
    noHp: noHpSchema,
    role: z.enum(["ADMIN", "PETUGAS"]),
    bankSampahId: z.string().trim().min(1).nullish(),
    isActive: z.boolean().optional().default(true),
  })
  .refine(petugasButuhBank, {
    message: "bankSampahId wajib untuk PETUGAS (BR-02)",
    path: ["bankSampahId"],
  })

export const userUpdateSchema = z
  .object({
    email: z.string().trim().email("email tidak valid").optional(),
    password: z.string().min(6, "password minimal 6 karakter").optional(),
    nama: z.string().trim().min(1).optional(),
    noHp: noHpSchema,
    role: z.enum(["ADMIN", "PETUGAS"]).optional(),
    bankSampahId: z.string().trim().min(1).nullish(),
    isActive: z.boolean().optional(),
  })
  .refine(petugasButuhBank, {
    message: "bankSampahId wajib untuk PETUGAS (BR-02)",
    path: ["bankSampahId"],
  })
