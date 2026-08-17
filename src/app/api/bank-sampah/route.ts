import { prisma } from "@/lib/prisma"
import { Prisma } from "@/generated/prisma/client"
import { bankSampahSchema } from "./schema"

const notDeleted = { deletedAt: null }

export async function GET() {
  const data = await prisma.bankSampah.findMany({ where: notDeleted })
  return Response.json(data)
}

export async function POST(request: Request) {
  const parsed = bankSampahSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues }, { status: 400 })
  }
  try {
    const data = await prisma.bankSampah.create({ data: parsed.data })
    return Response.json(data, { status: 201 })
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2002") {
        return Response.json({ error: "kelurahanId sudah punya bank sampah" }, { status: 409 })
      }
      if (e.code === "P2003") {
        return Response.json({ error: "kelurahanId tidak ditemukan" }, { status: 400 })
      }
    }
    return Response.json({ error: "gagal membuat bank sampah" }, { status: 400 })
  }
}
