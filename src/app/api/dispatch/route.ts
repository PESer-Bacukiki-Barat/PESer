import { prisma } from "@/lib/prisma"
import { dispatchSchema } from "./schema"
import { requireAuth } from "@/lib/auth"
import { ok, created, fail, failValidation } from "@/lib/response"

export async function GET() {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  const data = await prisma.dispatch.findMany({
    include: {
      bankSampah: true,
      pembeli: true,
      items: { include: { jenisSampah: true } },
    },
    orderBy: { createdAt: "desc" },
  })
  return ok(data)
}

export async function POST(request: Request) {
  const auth = await requireAuth("ADMIN")
  if (!auth.ok) return auth.response

  const parsed = dispatchSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return failValidation(parsed.error.issues)
  }

  try {
    const data = await prisma.dispatch.create({
      data: {
        kodeDispatch: parsed.data.kodeDispatch,
        bankSampahId: parsed.data.bankSampahId,
        pembeliId: parsed.data.pembeliId,
        dibuatOlehId: auth.user.id,
        tanggalJemput: parsed.data.tanggalJemput,
        totalNilai: parsed.data.totalNilai,
        alasanTolak: parsed.data.alasanTolak,
        alasanSelisih: parsed.data.alasanSelisih,
        selisihSignifikan: parsed.data.selisihSignifikan,
        items: {
          create: parsed.data.items.map((i) => ({
            jenisSampahId: i.jenisSampahId,
            beratTarget: i.beratTarget,
            hargaJualPerKg: i.hargaJualPerKg,
          })),
        },
      },
    })
    return created(data)
  } catch {
    return fail("PERMINTAAN_GAGAL", "gagal membuat dispatch")
  }
}
