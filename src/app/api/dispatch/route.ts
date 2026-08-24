import { prisma } from "@/lib/prisma"
import { Prisma } from "@/generated/prisma/client"
import { dispatchSchema } from "./schema"
import { requireAuth } from "@/lib/auth"
import { ok, created, fail, failValidation } from "@/lib/response"
import { denganAudit } from "@/lib/audit"

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

  // FR-D1 + §8.2 baris "(baru) -> DRAFT": target tidak boleh melebihi stock
  // tersedia (berat - beratReservasi). Tanpa ini dispatch bisa menjanjikan
  // barang yang tidak ada.
  const stockList = await prisma.stock.findMany({
    where: {
      bankSampahId: parsed.data.bankSampahId,
      jenisSampahId: { in: parsed.data.items.map((i) => i.jenisSampahId) },
    },
    select: {
      jenisSampahId: true,
      berat: true,
      beratReservasi: true,
      jenisSampah: { select: { nama: true } },
    },
  })
  const stockByJenis = new Map(stockList.map((s) => [s.jenisSampahId, s]))

  for (const item of parsed.data.items) {
    const stock = stockByJenis.get(item.jenisSampahId)
    const tersedia = stock ? stock.berat.sub(stock.beratReservasi) : new Prisma.Decimal(0)
    if (tersedia.lt(item.beratTarget)) {
      const nama = stock?.jenisSampah.nama ?? item.jenisSampahId
      return fail(
        "STOCK_TIDAK_CUKUP",
        `Stock ${nama} tersedia ${tersedia.toFixed(2)} kg, diminta ${Number(item.beratTarget).toFixed(2)} kg`,
        { field: "items" },
      )
    }
  }

  try {
    const data = await denganAudit(
      { operasi: "BUAT", entitas: "Dispatch", userId: auth.user.id },
      (tx) =>
        tx.dispatch.create({
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
        }),
    )
    return created(data)
  } catch {
    return fail("PERMINTAAN_GAGAL", "gagal membuat dispatch")
  }
}
