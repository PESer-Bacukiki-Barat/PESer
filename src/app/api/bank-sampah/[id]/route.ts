import { prisma } from "@/lib/prisma"
import { Prisma } from "@/generated/prisma/client"
import { bankSampahSchema } from "../schema"
import { requireAuth } from "@/lib/auth"
import { ok, noContent, fail, failValidation } from "@/lib/response"
import { denganAudit } from "@/lib/audit"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  const { id } = await params
  const data = await prisma.bankSampah.findFirst({ where: { id, deletedAt: null } })
  if (!data) return fail("TIDAK_DITEMUKAN", "Data tidak ditemukan")
  return ok(data)
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth("ADMIN")
  if (!auth.ok) return auth.response
  const { id } = await params
  const parsed = bankSampahSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return failValidation(parsed.error.issues)
  }
  try {
    const data = await denganAudit(
      { operasi: "UBAH", entitas: "BankSampah", userId: auth.user.id },
      (tx) => tx.bankSampah.update({ where: { id }, data: parsed.data }),
      (tx) => tx.bankSampah.findFirst({ where: { id, deletedAt: null } }),
    )
    return ok(data)
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2025") return fail("TIDAK_DITEMUKAN", "Data tidak ditemukan")
      if (e.code === "P2002") {
        return fail("DUPLIKAT", "kelurahanId sudah punya bank sampah", { field: "kelurahanId" })
      }
      if (e.code === "P2003") {
        return fail("VALIDASI_GAGAL", "kelurahanId tidak ditemukan", { field: "kelurahanId" })
      }
    }
    return fail("PERMINTAAN_GAGAL", "gagal mengupdate bank sampah")
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth("ADMIN")
  if (!auth.ok) return auth.response
  const { id } = await params
  try {
    await denganAudit(
      { operasi: "HAPUS", entitas: "BankSampah", userId: auth.user.id },
      (tx) => tx.bankSampah.update({ where: { id }, data: { deletedAt: new Date() } }),
      (tx) => tx.bankSampah.findFirst({ where: { id, deletedAt: null } }),
    )
    return noContent()
  } catch {
    return fail("TIDAK_DITEMUKAN", "Data tidak ditemukan")
  }
}
