import { jalankanTransisi } from "../aksi"

/** POST /api/dispatch/:id/terima — DISPATCHED -> DITERIMA (PETUGAS pemilik, FR-D3). */
export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  return jalankanTransisi(request, ctx, "DITERIMA")
}
