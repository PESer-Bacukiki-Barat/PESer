import { prisma } from "@/lib/prisma"
import { Prisma } from "@/generated/prisma/client"
import { jenisSampahSchema } from "./schema"
import { requireAuth } from "@/lib/auth"

const notDeleted = { deletedAt: null }

export async function GET() {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  const data = await prisma.jenisSampah.findMany({ where: notDeleted })
  return Response.json(data)
}

export async function POST(request: Request) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  const parsed = jenisSampahSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues }, { status: 400 })
  }
  try {
    const data = await prisma.jenisSampah.create({ data: parsed.data })
    return Response.json(data, { status: 201 })
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return Response.json({ error: "kode sudah dipakai" }, { status: 409 })
    }
    return Response.json({ error: "gagal membuat jenis sampah" }, { status: 400 })
  }
}
