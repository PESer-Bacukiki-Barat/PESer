import { z } from "zod"

const petugasButuhBank = (data: { role?: string; bankSampahId?: string | null }) =>
  data.role !== "PETUGAS" || !!data.bankSampahId

export const userCreateSchema = z
  .object({
    email: z.string().trim().email("email tidak valid"),
    password: z.string().min(6, "password minimal 6 karakter"),
    nama: z.string().trim().min(1, "nama wajib"),
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
    role: z.enum(["ADMIN", "PETUGAS"]).optional(),
    bankSampahId: z.string().trim().min(1).nullish(),
    isActive: z.boolean().optional(),
  })
  .refine(petugasButuhBank, {
    message: "bankSampahId wajib untuk PETUGAS (BR-02)",
    path: ["bankSampahId"],
  })
