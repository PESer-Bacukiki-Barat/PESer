import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { userCreateSchema } from "./schema"
import { requireAuth } from "@/lib/auth"
import { ok, created, fail, failValidation } from "@/lib/response"

const notDeleted = { deletedAt: null }

export async function GET() {
  const auth = await requireAuth("ADMIN")
  if (!auth.ok) return auth.response
  const data = await prisma.user.findMany({
    where: notDeleted,
    include: { bankSampah: { select: { id: true, nama: true } } },
  })
  return ok(data)
}

export async function POST(request: Request) {
  const auth = await requireAuth("ADMIN")
  if (!auth.ok) return auth.response
  const parsed = userCreateSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return failValidation(parsed.error.issues)
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
    return created(data)
  } catch {
    return fail("DUPLIKAT", "email sudah dipakai", { field: "email" })
  }
}
