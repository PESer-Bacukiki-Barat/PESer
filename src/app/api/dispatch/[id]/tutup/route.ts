import { jalankanTransisi, pakaiSchema, tutupSchema } from "../aksi"

/**
 * POST /api/dispatch/:id/tutup — SERAH_TERIMA -> SELESAI (ADMIN, FR-D6).
 * BR-13: SELESAI final, tidak ada transisi keluar.
 */
export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  return jalankanTransisi(
    request,
    ctx,
    "SELESAI",
    pakaiSchema(tutupSchema, (d) => ({ totalNilai: d.totalNilai })),
  )
}
