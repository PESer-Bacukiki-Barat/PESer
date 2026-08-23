import { prisma } from "@/lib/prisma"
import { Prisma } from "@/generated/prisma/client"
import { nasabahSchema } from "../schema"
import { requireAuth } from "@/lib/auth"
import { ok, noContent, fail, failValidation } from "@/lib/response"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  const { id } = await params
  const data = await prisma.nasabah.findFirst({ where: { id, deletedAt: null } })
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
  try {
    const data = await prisma.nasabah.update({ where: { id }, data: parsed.data })
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
  try {
    await prisma.nasabah.update({ where: { id }, data: { deletedAt: new Date() } })
    return noContent()
  } catch {
    return fail("TIDAK_DITEMUKAN", "Data tidak ditemukan")
  }
}
