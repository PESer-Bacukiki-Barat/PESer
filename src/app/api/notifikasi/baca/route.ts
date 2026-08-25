import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { ok, failValidation } from "@/lib/response"
import { bacaNotifikasiSchema } from "../schema"

/**
 * POST /api/notifikasi/baca — tandai notifikasi sudah dibaca (FR-E5).
 *
 * Tanpa `id` berarti semua milik akun ini. Filter `userId` selalu ikut, jadi
 * `id` milik orang lain tidak cocok dengan apa pun dan mengembalikan 0 —
 * bukan 403 yang justru membocorkan bahwa id itu ada.
 *
 * Tidak lewat denganAudit(): §2.5 aturan 2 menuntut jejak untuk perubahan data
 * domain, sedangkan ini penanda baca milik pengguna sendiri — menuliskannya ke
 * AuditLog hanya akan menenggelamkan jejak yang benar-benar diaudit.
 */
export async function POST(request: Request) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  const parsed = bacaNotifikasiSchema.safeParse(
    await request.json().catch(() => ({})),
  )
  if (!parsed.success) return failValidation(parsed.error.issues)

  const { count } = await prisma.notifikasi.updateMany({
    where: {
      userId: auth.user.id,
      deletedAt: null,
      dibacaPada: null,
      ...(parsed.data.id ? { id: parsed.data.id } : {}),
    },
    data: { dibacaPada: new Date() },
  })

  return ok({ ditandai: count })
}
