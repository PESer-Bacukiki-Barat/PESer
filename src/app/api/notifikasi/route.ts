import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { ok, failValidation } from "@/lib/response"
import { BATAS_NOTIFIKASI } from "@/lib/constants"
import { notifikasiQuerySchema } from "./schema"

/**
 * GET /api/notifikasi — daftar notifikasi milik akun yang login (FR-E5).
 *
 * PRD §4.2: notifikasi ditarik aplikasi dari DB, tanpa cron dan tanpa broker.
 * Endpoint ini yang ditarik lonceng di header.
 *
 * Tidak ada parameter penerima: barisnya sudah milik satu akun, dan `userId`
 * diambil dari sesi — bukan dari query (§2.5 aturan 4).
 */
export async function GET(request: Request) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  const parsed = notifikasiQuerySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams),
  )
  if (!parsed.success) return failValidation(parsed.error.issues)

  const where = {
    userId: auth.user.id,
    deletedAt: null,
    ...(parsed.data.belumDibaca ? { dibacaPada: null } : {}),
  }

  const [daftar, belumDibaca] = await Promise.all([
    prisma.notifikasi.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: parsed.data.batas ?? BATAS_NOTIFIKASI,
      select: {
        id: true,
        tipe: true,
        judul: true,
        pesan: true,
        tautan: true,
        dibacaPada: true,
        createdAt: true,
        bankSampah: { select: { id: true, nama: true } },
      },
    }),
    // Dihitung terpisah dari daftar: badge harus menunjukkan jumlah sebenarnya,
    // bukan sebanyak yang kebetulan muat di halaman pertama.
    prisma.notifikasi.count({
      where: { userId: auth.user.id, deletedAt: null, dibacaPada: null },
    }),
  ])

  return ok({ daftar, belumDibaca })
}
