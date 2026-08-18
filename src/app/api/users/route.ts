import { prisma } from "@/lib/prisma"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { userCreateSchema } from "./schema"
import { requireAuth } from "@/lib/auth"

const notDeleted = { deletedAt: null }

export async function GET() {
  const auth = await requireAuth("ADMIN")
  if (!auth.ok) return auth.response
  const data = await prisma.user.findMany({
    where: notDeleted,
    include: { bankSampah: { select: { id: true, nama: true } } },
  })
  return Response.json(data)
}

export async function POST(request: Request) {
  const auth = await requireAuth("ADMIN")
  if (!auth.ok) return auth.response
  const parsed = userCreateSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues }, { status: 400 })
  }
  const { password, ...rest } = parsed.data

  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: rest.email,
    password,
    email_confirm: true,
  })
  if (authError) {
    return Response.json({ error: authError.message }, { status: 409 })
  }

  try {
    const data = await prisma.user.create({
      data: { ...rest, authUserId: authUser.user.id },
    })
    return Response.json(data, { status: 201 })
  } catch {
    await supabaseAdmin.auth.admin.deleteUser(authUser.user.id).catch(() => null)
    return Response.json({ error: "email sudah dipakai" }, { status: 409 })
  }
}
