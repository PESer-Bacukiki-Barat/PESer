import { prisma } from "@/lib/prisma"
import { Prisma } from "@/generated/prisma/client"
import { jenisSampahSchema } from "../schema"
import { requireAuth } from "@/lib/auth"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  const { id } = await params
  const data = await prisma.jenisSampah.findFirst({ where: { id, deletedAt: null } })
  if (!data) return Response.json({ error: "tidak ditemukan" }, { status: 404 })
  return Response.json(data)
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth("ADMIN")
  if (!auth.ok) return auth.response
  const { id } = await params
  const parsed = jenisSampahSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues }, { status: 400 })
  }
  try {
    const data = await prisma.jenisSampah.update({ where: { id }, data: parsed.data })
    return Response.json(data)
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2025") return Response.json({ error: "tidak ditemukan" }, { status: 404 })
      if (e.code === "P2002") {
        return Response.json({ error: "kode sudah dipakai" }, { status: 409 })
      }
    }
    return Response.json({ error: "gagal mengupdate jenis sampah" }, { status: 400 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth("ADMIN")
  if (!auth.ok) return auth.response
  const { id } = await params
  try {
    await prisma.jenisSampah.update({ where: { id }, data: { deletedAt: new Date() } })
    return new Response(null, { status: 204 })
  } catch {
    return Response.json({ error: "tidak ditemukan" }, { status: 404 })
  }
}
