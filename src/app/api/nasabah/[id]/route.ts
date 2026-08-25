import { prisma } from "@/lib/prisma"
import { Prisma } from "@/generated/prisma/client"
import { nasabahSchema } from "../schema"
import { requireAuth } from "@/lib/auth"
import { ok, noContent, fail, failValidation } from "@/lib/response"
import { denganAudit } from "@/lib/audit"
import { filterLingkup, lingkupTulis } from "../lingkup"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  const { id } = await params
  // Lingkup ikut ke dalam where, jadi nasabah pos lain menghasilkan 404 —
  // bukan 403 yang justru memberi tahu bahwa id itu ada.
  const data = await prisma.nasabah.findFirst({
    where: { id, deletedAt: null, ...filterLingkup(auth.user) },
  })
  if (!data) return fail("TIDAK_DITEMUKAN", "Data tidak ditemukan")
  return ok(data)
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  const { id } = await params
  const parsed = nasabahSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return failValidation(parsed.error.issues)
  }
  const lingkup = lingkupTulis(auth.user, parsed.data.bankSampahId)
  if (!lingkup.ok) return lingkup.response

  // Barisnya harus ada DI DALAM lingkup pemanggil. Tanpa pemeriksaan ini,
  // update by id bisa menyentuh nasabah pos lain — dan memindahkannya.
  const milikSendiri = await prisma.nasabah.findFirst({
    where: { id, deletedAt: null, ...filterLingkup(auth.user) },
    select: { id: true },
  })
  if (!milikSendiri) return fail("TIDAK_DITEMUKAN", "Data tidak ditemukan")

  try {
    const data = await denganAudit(
      { operasi: "UBAH", entitas: "Nasabah", userId: auth.user.id },
      (tx) =>
        tx.nasabah.update({
          where: { id },
          data: { ...parsed.data, bankSampahId: lingkup.bankSampahId },
        }),
      (tx) => tx.nasabah.findFirst({ where: { id, deletedAt: null } }),
    )
    return ok(data)
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2025") return fail("TIDAK_DITEMUKAN", "Data tidak ditemukan")
      if (e.code === "P2002") {
        return fail("DUPLIKAT", "kodeNasabah sudah dipakai", { field: "kodeNasabah" })
      }
      if (e.code === "P2003") {
        return fail("VALIDASI_GAGAL", "bankSampahId tidak ditemukan", { field: "bankSampahId" })
      }
    }
    return fail("PERMINTAAN_GAGAL", "gagal mengupdate nasabah")
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  const { id } = await params
  const milikSendiri = await prisma.nasabah.findFirst({
    where: { id, deletedAt: null, ...filterLingkup(auth.user) },
    select: { id: true },
  })
  if (!milikSendiri) return fail("TIDAK_DITEMUKAN", "Data tidak ditemukan")

  try {
    await denganAudit(
      { operasi: "HAPUS", entitas: "Nasabah", userId: auth.user.id },
      (tx) => tx.nasabah.update({ where: { id }, data: { deletedAt: new Date() } }),
      (tx) => tx.nasabah.findFirst({ where: { id, deletedAt: null } }),
    )
    return noContent()
  } catch {
    return fail("TIDAK_DITEMUKAN", "Data tidak ditemukan")
  }
}
