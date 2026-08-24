import { z } from "zod"

import { requireAuth } from "@/lib/auth"
import { ok, failValidation } from "@/lib/response"
import { CSV_BOM } from "@/lib/export"

/** Query periode laporan — inklusif di kedua ujung. */
export const periodeSchema = z.object({
  dari: z.coerce.date().optional(),
  sampai: z.coerce.date().optional(),
  format: z.enum(["json", "csv"]).optional().default("json"),
})

type Ctx<T> = {
  /** Nama berkas tanpa ekstensi, mis. "laporan-penjualan-2026-08". */
  namaBerkas: string
  ambil: (periode: { dari?: Date; sampai?: Date }) => Promise<T>
  keCsv: (data: T) => string
}

/**
 * Pembungkus bersama dua endpoint laporan.
 *
 * PRD §2.4 dan baris 225 menetapkan laporan sebagai kewenangan ADMIN saja
 * (PETUGAS eksplisit ❌), dan §4.3 [WAJIB] melarang halaman laporan di-cache
 * karena angka basi bisa memicu dispatch dobel jual — karena itu setiap
 * respons di sini membawa `no-store`.
 *
 * Catatan kontrak: respons CSV TIDAK memakai envelope §2.5. Envelope itu
 * mengatur bentuk JSON, sementara ini berkas unduhan — pengecualian yang
 * disengaja, sama seperti 204 tanpa body.
 */
export async function laporanHandler<T>(request: Request, ctx: Ctx<T>): Promise<Response> {
  const auth = await requireAuth("ADMIN")
  if (!auth.ok) return auth.response

  const url = new URL(request.url)
  const parsed = periodeSchema.safeParse({
    dari: url.searchParams.get("dari") ?? undefined,
    sampai: url.searchParams.get("sampai") ?? undefined,
    format: url.searchParams.get("format") ?? undefined,
  })
  if (!parsed.success) return failValidation(parsed.error.issues)

  const { dari, sampai, format } = parsed.data
  const data = await ctx.ambil({ dari, sampai })

  if (format === "csv") {
    return new Response(CSV_BOM + ctx.keCsv(data), {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${ctx.namaBerkas}.csv"`,
        "Cache-Control": "no-store",
      },
    })
  }

  const res = ok(data)
  res.headers.set("Cache-Control", "no-store")
  return res
}

/** Sufiks nama berkas dari periode, supaya unduhan tidak saling menimpa. */
export function sufiksPeriode(url: URL): string {
  const dari = url.searchParams.get("dari")
  const sampai = url.searchParams.get("sampai")
  if (!dari && !sampai) return "semua"
  return [dari, sampai].filter(Boolean).join("_sd_")
}
