import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
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
  const passwordHash = await bcrypt.hash(password, 10)

  try {
    const data = await prisma.user.create({
      data: {
        ...rest,
        credential: { create: { email: rest.email, passwordHash } },
      },
      include: { bankSampah: { select: { id: true, nama: true } } },
    })
    return Response.json(data, { status: 201 })
  } catch {
    return Response.json({ error: "email sudah dipakai" }, { status: 409 })
  }
}
