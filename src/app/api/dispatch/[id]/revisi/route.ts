import { jalankanTransisi } from "../aksi"

/**
 * POST /api/dispatch/:id/revisi — DITOLAK -> DRAFT (ADMIN).
 *
 * Transisi ini ada di tabel §8.2 ("DITOLAK -> DRAFT: Revisi target / ganti
 * bank sampah") tapi tabel endpoint §2.5 tidak mencantumkannya, sehingga
 * satu-satunya transisi sah itu sebelumnya tidak bisa dipanggil dari mana pun.
 * Setelah kembali DRAFT, isinya bisa disunting lewat PUT lalu diterbitkan lagi.
 */
export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  return jalankanTransisi(request, ctx, "DRAFT")
}
