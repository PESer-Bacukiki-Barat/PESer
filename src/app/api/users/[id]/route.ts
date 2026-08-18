import { prisma } from "@/lib/prisma"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { userUpdateSchema } from "../schema"
import { requireAuth } from "@/lib/auth"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth("ADMIN")
  if (!auth.ok) return auth.response
  const { id } = await params
  const data = await prisma.user.findFirst({
    where: { id, deletedAt: null },
    include: { bankSampah: { select: { id: true, nama: true } } },
  })
  if (!data) return Response.json({ error: "tidak ditemukan" }, { status: 404 })
  return Response.json(data)
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth("ADMIN")
  if (!auth.ok) return auth.response
  const { id } = await params
  const existing = await prisma.user.findFirst({ where: { id, deletedAt: null } })
  if (!existing) return Response.json({ error: "tidak ditemukan" }, { status: 404 })

  const parsed = userUpdateSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues }, { status: 400 })
  }

  const { password, ...rest } = parsed.data
  const authUpdates: { email?: string; password?: string } = {}
  if (rest.email) authUpdates.email = rest.email
  if (password) authUpdates.password = password
  if (Object.keys(authUpdates).length > 0) {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(existing.authUserId, authUpdates)
    if (error) return Response.json({ error: error.message }, { status: 409 })
  }

  try {
    const data = await prisma.user.update({ where: { id }, data: rest })
    return Response.json(data)
  } catch {
    return Response.json({ error: "email sudah dipakai user lain" }, { status: 409 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth("ADMIN")
  if (!auth.ok) return auth.response
  const { id } = await params
  const existing = await prisma.user.findFirst({ where: { id, deletedAt: null } })
  if (!existing) return Response.json({ error: "tidak ditemukan" }, { status: 404 })

  await supabaseAdmin.auth.admin
    .updateUserById(existing.authUserId, { ban_duration: "876000h" })
    .catch(() => null)

  await prisma.user.update({ where: { id }, data: { deletedAt: new Date() } })
  return new Response(null, { status: 204 })
}
