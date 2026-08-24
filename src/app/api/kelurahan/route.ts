import { prisma } from "@/lib/prisma"
import { kelurahanSchema } from "./schema"
import { requireAuth } from "@/lib/auth"
import { ok, created, fail, failValidation } from "@/lib/response"
import { denganAudit } from "@/lib/audit"

const notDeleted = { deletedAt: null }

export async function GET() {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  const data = await prisma.kelurahan.findMany({ where: notDeleted })
  return ok(data)
}

export async function POST(request: Request) {
  const auth = await requireAuth("ADMIN")
  if (!auth.ok) return auth.response
  const parsed = kelurahanSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return failValidation(parsed.error.issues)
  }
  try {
    const data = await denganAudit(
      { operasi: "BUAT", entitas: "Kelurahan", userId: auth.user.id },
      (tx) => tx.kelurahan.create({ data: parsed.data }),
    )
    return created(data)
  } catch {
    return fail("DUPLIKAT", "kodeWilayah sudah dipakai", { field: "kodeWilayah" })
  }
}
