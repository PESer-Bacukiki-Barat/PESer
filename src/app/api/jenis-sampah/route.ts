import { prisma } from "@/lib/prisma"
import { Prisma } from "@/generated/prisma/client"
import { jenisSampahSchema } from "./schema"
import { requireAuth } from "@/lib/auth"
import { ok, created, fail, failValidation } from "@/lib/response"

const notDeleted = { deletedAt: null }

export async function GET() {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  const data = await prisma.jenisSampah.findMany({ where: notDeleted })
  return ok(data)
}

export async function POST(request: Request) {
  const auth = await requireAuth("ADMIN")
  if (!auth.ok) return auth.response
  const parsed = jenisSampahSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return failValidation(parsed.error.issues)
  }
  try {
    const data = await prisma.jenisSampah.create({ data: parsed.data })
    return created(data)
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return fail("DUPLIKAT", "kode sudah dipakai", { field: "kode" })
    }
    return fail("PERMINTAAN_GAGAL", "gagal membuat jenis sampah")
  }
}
