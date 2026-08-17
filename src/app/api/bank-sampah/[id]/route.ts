import { prisma } from "@/lib/prisma"
import { Prisma } from "@/generated/prisma/client"
import { bankSampahSchema } from "../schema"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await prisma.bankSampah.findFirst({ where: { id, deletedAt: null } })
  if (!data) return Response.json({ error: "tidak ditemukan" }, { status: 404 })
  return Response.json(data)
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const parsed = bankSampahSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues }, { status: 400 })
  }
  try {
    const data = await prisma.bankSampah.update({ where: { id }, data: parsed.data })
    return Response.json(data)
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2025") return Response.json({ error: "tidak ditemukan" }, { status: 404 })
      if (e.code === "P2002") {
        return Response.json({ error: "kelurahanId sudah punya bank sampah" }, { status: 409 })
      }
      if (e.code === "P2003") {
        return Response.json({ error: "kelurahanId tidak ditemukan" }, { status: 400 })
      }
    }
    return Response.json({ error: "gagal mengupdate bank sampah" }, { status: 400 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    await prisma.bankSampah.update({ where: { id }, data: { deletedAt: new Date() } })
    return new Response(null, { status: 204 })
  } catch {
    return Response.json({ error: "tidak ditemukan" }, { status: 404 })
  }
}
