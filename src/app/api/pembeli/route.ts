import { prisma } from "@/lib/prisma"
import { pembeliSchema } from "./schema"
import { requireAuth } from "@/lib/auth"

const notDeleted = { deletedAt: null }

export async function GET() {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  const data = await prisma.pembeli.findMany({ where: notDeleted })
  return Response.json(data)
}

export async function POST(request: Request) {
  const auth = await requireAuth("ADMIN")
  if (!auth.ok) return auth.response
  const parsed = pembeliSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues }, { status: 400 })
  }
  const data = await prisma.pembeli.create({ data: parsed.data })
  return Response.json(data, { status: 201 })
}
