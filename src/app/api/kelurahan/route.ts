import { prisma } from "@/lib/prisma"
import { kelurahanSchema } from "./schema"
import { requireAuth } from "@/lib/auth"

const notDeleted = { deletedAt: null }

export async function GET() {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  const data = await prisma.kelurahan.findMany({ where: notDeleted })
  return Response.json(data)
}

export async function POST(request: Request) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  const parsed = kelurahanSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues }, { status: 400 })
  }
  try {
    const data = await prisma.kelurahan.create({ data: parsed.data })
    return Response.json(data, { status: 201 })
  } catch {
    return Response.json({ error: "kodeWilayah sudah dipakai" }, { status: 409 })
  }
}
