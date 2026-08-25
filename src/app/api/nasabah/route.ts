import { prisma } from "@/lib/prisma"
import { Prisma } from "@/generated/prisma/client"
import { nasabahSchema } from "./schema"
import { requireAuth } from "@/lib/auth"
import { ok, created, fail, failValidation } from "@/lib/response"
import { denganAudit } from "@/lib/audit"
import { filterLingkup, lingkupTulis } from "./lingkup"

const notDeleted = { deletedAt: null }

export async function GET() {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  // §2.4 baris 209: petugas hanya bank sampahnya sendiri. Lingkupnya dari sesi.
  const data = await prisma.nasabah.findMany({
    where: { ...notDeleted, ...filterLingkup(auth.user) },
    orderBy: { kodeNasabah: "asc" },
  })
  return ok(data)
}

export async function POST(request: Request) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  const parsed = nasabahSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return failValidation(parsed.error.issues)
  }
  const lingkup = lingkupTulis(auth.user, parsed.data.bankSampahId)
  if (!lingkup.ok) return lingkup.response

  try {
    const data = await denganAudit(
      { operasi: "BUAT", entitas: "Nasabah", userId: auth.user.id },
      (tx) =>
        tx.nasabah.create({
          data: { ...parsed.data, bankSampahId: lingkup.bankSampahId },
        }),
    )
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
