import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { userUpdateSchema } from "../schema"
import { requireAuth } from "@/lib/auth"
import { ok, noContent, fail, failValidation } from "@/lib/response"
import { denganAudit } from "@/lib/audit"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth("ADMIN")
  if (!auth.ok) return auth.response
  const { id } = await params
  const data = await prisma.user.findFirst({
    where: { id, deletedAt: null },
    include: { bankSampah: { select: { id: true, nama: true } } },
  })
  if (!data) return fail("TIDAK_DITEMUKAN", "Data tidak ditemukan")
  return ok(data)
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth("ADMIN")
  if (!auth.ok) return auth.response
  const { id } = await params
  const existing = await prisma.user.findFirst({ where: { id, deletedAt: null } })
  if (!existing) return fail("TIDAK_DITEMUKAN", "Data tidak ditemukan")

  const parsed = userUpdateSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return failValidation(parsed.error.issues)
  }

  const { password, ...rest } = parsed.data
  const credentialData: { email?: string; passwordHash?: string } = {}
  if (rest.email && rest.email !== existing.email) credentialData.email = rest.email
  if (password) credentialData.passwordHash = await bcrypt.hash(password, 10)

  try {
    const data = await denganAudit(
      { operasi: "UBAH", entitas: "User", userId: auth.user.id },
      (tx) =>
        tx.user.update({
          where: { id },
          data: {
            ...rest,
            ...(Object.keys(credentialData).length > 0
              ? { credential: { update: credentialData } }
              : {}),
          },
        }),
      // `existing` sudah dibaca di atas untuk cek 404; dipakai ulang di sini
      // supaya tidak ada query kedua untuk hal yang sama.
      () => Promise.resolve(existing),
    )
    return ok(data)
  } catch {
    return fail("DUPLIKAT", "email sudah dipakai user lain", { field: "email" })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth("ADMIN")
  if (!auth.ok) return auth.response
  const { id } = await params
  const existing = await prisma.user.findFirst({ where: { id, deletedAt: null } })
  if (!existing) return fail("TIDAK_DITEMUKAN", "Data tidak ditemukan")

  await denganAudit(
    { operasi: "HAPUS", entitas: "User", userId: auth.user.id },
    (tx) =>
      tx.user.update({
        where: { id },
        data: { deletedAt: new Date(), credential: { update: { deletedAt: new Date() } } },
      }),
    () => Promise.resolve(existing),
  )
  return noContent()
}
