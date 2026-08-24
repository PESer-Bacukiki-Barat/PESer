import { prisma } from "@/lib/prisma"
import { pembeliSchema } from "../schema"
import { requireAuth } from "@/lib/auth"
import { ok, noContent, fail, failValidation } from "@/lib/response"
import { denganAudit } from "@/lib/audit"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  const { id } = await params
  const data = await prisma.pembeli.findFirst({ where: { id, deletedAt: null } })
  if (!data) return fail("TIDAK_DITEMUKAN", "Data tidak ditemukan")
  return ok(data)
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth("ADMIN")
  if (!auth.ok) return auth.response
  const { id } = await params
  const parsed = pembeliSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return failValidation(parsed.error.issues)
  }
  try {
    const data = await denganAudit(
      { operasi: "UBAH", entitas: "Pembeli", userId: auth.user.id },
      (tx) => tx.pembeli.update({ where: { id }, data: parsed.data }),
      (tx) => tx.pembeli.findFirst({ where: { id, deletedAt: null } }),
    )
    return ok(data)
  } catch {
    return fail("TIDAK_DITEMUKAN", "Data tidak ditemukan")
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth("ADMIN")
  if (!auth.ok) return auth.response
  const { id } = await params
  try {
    await denganAudit(
      { operasi: "HAPUS", entitas: "Pembeli", userId: auth.user.id },
      (tx) => tx.pembeli.update({ where: { id }, data: { deletedAt: new Date() } }),
      (tx) => tx.pembeli.findFirst({ where: { id, deletedAt: null } }),
    )
    return noContent()
  } catch {
    return fail("TIDAK_DITEMUKAN", "Data tidak ditemukan")
  }
}
