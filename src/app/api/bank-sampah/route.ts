import { prisma } from "@/lib/prisma"
import { Prisma } from "@/generated/prisma/client"
import { bankSampahSchema } from "./schema"
import { requireAuth } from "@/lib/auth"
import { ok, created, fail, failValidation } from "@/lib/response"
import { denganAudit } from "@/lib/audit"

const notDeleted = { deletedAt: null }

export async function GET() {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  const data = await prisma.bankSampah.findMany({ where: notDeleted })
  return ok(data)
}

export async function POST(request: Request) {
  const auth = await requireAuth("ADMIN")
  if (!auth.ok) return auth.response
  const parsed = bankSampahSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return failValidation(parsed.error.issues)
  }
  try {
    const data = await denganAudit(
      { operasi: "BUAT", entitas: "BankSampah", userId: auth.user.id },
      (tx) => tx.bankSampah.create({ data: parsed.data }),
    )
    return created(data)
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2002") {
        return fail("DUPLIKAT", "kelurahanId sudah punya bank sampah", { field: "kelurahanId" })
      }
      if (e.code === "P2003") {
        return fail("VALIDASI_GAGAL", "kelurahanId tidak ditemukan", { field: "kelurahanId" })
      }
    }
    return fail("PERMINTAAN_GAGAL", "gagal membuat bank sampah")
  }
}
