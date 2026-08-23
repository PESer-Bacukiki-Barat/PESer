import { prisma } from "@/lib/prisma"
import { Prisma } from "@/generated/prisma/client"
import { nasabahSchema } from "./schema"
import { requireAuth } from "@/lib/auth"
import { ok, created, fail, failValidation } from "@/lib/response"

const notDeleted = { deletedAt: null }

export async function GET() {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  const data = await prisma.nasabah.findMany({ where: notDeleted })
  return ok(data)
}

export async function POST(request: Request) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  const parsed = nasabahSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return failValidation(parsed.error.issues)
  }
  try {
    const data = await prisma.nasabah.create({ data: parsed.data })
    return created(data)
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2002") {
        return fail("DUPLIKAT", "kodeNasabah sudah dipakai", { field: "kodeNasabah" })
      }
      if (e.code === "P2003") {
        return fail("VALIDASI_GAGAL", "bankSampahId tidak ditemukan", { field: "bankSampahId" })
      }
    }
    return fail("PERMINTAAN_GAGAL", "gagal membuat nasabah")
  }
}
