import { jalankanTransisi } from "../aksi"

/**
 * POST /api/dispatch/:id/batalkan — DIBATALKAN (ADMIN, FR-D7).
 *
 * Tidak tercantum di tabel endpoint §2.5, tapi FR-D7 "Batalkan dispatch"
 * ada dan §8.2 memuat empat transisi menuju DIBATALKAN. Reservasi stock
 * dilepas kalau dispatch masih menahannya.
 */
export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  return jalankanTransisi(request, ctx, "DIBATALKAN")
}
