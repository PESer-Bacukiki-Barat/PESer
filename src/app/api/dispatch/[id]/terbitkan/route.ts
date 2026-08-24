import { jalankanTransisi } from "../aksi"

/** POST /api/dispatch/:id/terbitkan — DRAFT -> DISPATCHED (ADMIN, FR-D2). */
export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  return jalankanTransisi(request, ctx, "DISPATCHED")
}
