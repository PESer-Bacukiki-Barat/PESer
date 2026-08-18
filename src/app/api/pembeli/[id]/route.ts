import { prisma } from "@/lib/prisma"
import { pembeliSchema } from "../schema"
import { requireAuth } from "@/lib/auth"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  const { id } = await params
  const data = await prisma.pembeli.findFirst({ where: { id, deletedAt: null } })
  if (!data) return Response.json({ error: "tidak ditemukan" }, { status: 404 })
  return Response.json(data)
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  const { id } = await params
  const parsed = pembeliSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues }, { status: 400 })
  }
  try {
    const data = await prisma.pembeli.update({ where: { id }, data: parsed.data })
    return Response.json(data)
  } catch {
    return Response.json({ error: "tidak ditemukan" }, { status: 404 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  const { id } = await params
  try {
    await prisma.pembeli.update({ where: { id }, data: { deletedAt: new Date() } })
    return new Response(null, { status: 204 })
  } catch {
    return Response.json({ error: "tidak ditemukan" }, { status: 404 })
  }
}
