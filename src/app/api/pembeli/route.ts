import { prisma } from "@/lib/prisma"
import { pembeliSchema } from "./schema"
import { requireAuth } from "@/lib/auth"
import { ok, created, failValidation } from "@/lib/response"
import { denganAudit } from "@/lib/audit"

const notDeleted = { deletedAt: null }

export async function GET() {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  const data = await prisma.pembeli.findMany({ where: notDeleted })
  return ok(data)
}

export async function POST(request: Request) {
  const auth = await requireAuth("ADMIN")
  if (!auth.ok) return auth.response
  const parsed = pembeliSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return failValidation(parsed.error.issues)
  }
  const data = await denganAudit(
      { operasi: "BUAT", entitas: "Pembeli", userId: auth.user.id },
      (tx) => tx.pembeli.create({ data: parsed.data }),
    )
  return created(data)
}
