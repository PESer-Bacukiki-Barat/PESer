import { prisma } from "@/lib/prisma"
import { kelurahanSchema } from "../schema"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await prisma.kelurahan.findFirst({ where: { id, deletedAt: null } })
  if (!data) return Response.json({ error: "tidak ditemukan" }, { status: 404 })
  return Response.json(data)
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const parsed = kelurahanSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues }, { status: 400 })
  }
  try {
    const data = await prisma.kelurahan.update({ where: { id }, data: parsed.data })
    return Response.json(data)
  } catch {
    return Response.json({ error: "tidak ditemukan" }, { status: 404 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    await prisma.kelurahan.update({ where: { id }, data: { deletedAt: new Date() } })
    return new Response(null, { status: 204 })
  } catch {
    return Response.json({ error: "tidak ditemukan" }, { status: 404 })
  }
}
