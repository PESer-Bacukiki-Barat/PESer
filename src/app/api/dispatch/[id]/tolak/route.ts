import { jalankanTransisi, pakaiSchema, tolakSchema } from "../aksi"

/**
 * POST /api/dispatch/:id/tolak — DISPATCHED -> DITOLAK (PETUGAS pemilik, FR-D3).
 * Alasan wajib (§8.2); reservasi stock dilepas oleh transisiDispatch.
 */
export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  return jalankanTransisi(
    request,
    ctx,
    "DITOLAK",
    pakaiSchema(tolakSchema, (d) => ({ alasanTolak: d.alasanTolak })),
  )
}
