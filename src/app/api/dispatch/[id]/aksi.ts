import { z } from "zod"
import type { StatusDispatch } from "@/generated/prisma/client"

import { requireAuth } from "@/lib/auth"
import { ok, fail, failValidation } from "@/lib/response"
import {
  transisiDispatch,
  StockMinusError,
  type TransisiInput,
} from "@/lib/dispatch-transisi"

/**
 * Pembungkus bersama untuk enam endpoint aksi dispatch (PRD §2.5).
 *
 * Otorisasi peran tidak dicek di sini: tabel §8.2 menetapkan pelaku
 * per-transisi ("ADMIN" atau "PETUGAS pemilik"), dan pengecekannya ada di
 * transisiDispatch() supaya tetap satu sumber kebenaran. Handler hanya
 * memastikan pemanggil sudah login lalu menyerahkan keputusan ke sana.
 */
export const beratAktualSchema = z.object({
  beratAktual: z
    .array(
      z.object({
        dispatchItemId: z.string().trim().min(1),
        beratAktual: z.coerce.number().positive("beratAktual harus > 0"),
      }),
    )
    .min(1, "beratAktual wajib"),
  alasanSelisih: z.string().trim().optional(),
})

export const tolakSchema = z.object({
  alasanTolak: z.string().trim().min(1, "alasanTolak wajib"),
})

export const tutupSchema = z.object({
  totalNilai: z.coerce.number().positive("totalNilai harus > 0").optional(),
})

type Ctx = { params: Promise<{ id: string }> }

export async function jalankanTransisi(
  request: Request,
  ctx: Ctx,
  ke: StatusDispatch,
  bacaBody?: (body: unknown) => { ok: true; data: Partial<TransisiInput> } | { ok: false; response: Response },
): Promise<Response> {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  const { id } = await ctx.params

  let tambahan: Partial<TransisiInput> = {}
  if (bacaBody) {
    const hasil = bacaBody(await request.json().catch(() => null))
    if (!hasil.ok) return hasil.response
    tambahan = hasil.data
  }

  try {
    const hasil = await transisiDispatch({ id, ke, user: auth.user, ...tambahan })
    if (!hasil.ok) return hasil.response
    return ok(hasil.dispatch)
  } catch (e) {
    if (e instanceof StockMinusError) {
      // BR-07 — ditangkap di sini karena dilempar dari dalam transaksi.
      return fail("STOCK_TIDAK_CUKUP", e.message, { field: "beratAktual" })
    }
    return fail("PERMINTAAN_GAGAL", "gagal memproses transisi dispatch")
  }
}

/** Bantu ubah hasil zod menjadi bentuk yang jalankanTransisi harapkan. */
export function pakaiSchema<T extends z.ZodType>(
  schema: T,
  petakan: (data: z.infer<T>) => Partial<TransisiInput>,
) {
  return (body: unknown) => {
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return { ok: false as const, response: failValidation(parsed.error.issues) }
    }
    return { ok: true as const, data: petakan(parsed.data) }
  }
}
