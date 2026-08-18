import { prisma } from "@/lib/prisma"
import { koreksiStockSchema } from "./schema"
import { requireAuth } from "@/lib/auth"

export async function GET() {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  const where =
    auth.user.role === "PETUGAS"
      ? { stock: { bankSampahId: auth.user.bankSampah?.id } }
      : {}
  const data = await prisma.koreksiStock.findMany({
    where,
    orderBy: { createdAt: "desc" },
  })
  return Response.json(data)
}

export async function POST(request: Request) {
  const auth = await requireAuth("PETUGAS")
  if (!auth.ok) return auth.response
  const parsed = koreksiStockSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues }, { status: 400 })
  }
  const { stockId, beratBaru, alasan } = parsed.data
  const bankSampahId = auth.user.bankSampah?.id
  if (!bankSampahId) {
    return Response.json({ error: "petugas belum ditugaskan ke bank sampah" }, { status: 403 })
  }

  const stock = await prisma.stock.findFirst({ where: { id: stockId, bankSampahId } })
  if (!stock) return Response.json({ error: "stock tidak ditemukan" }, { status: 404 })

  const beratLama = stock.berat.toNumber()
  const selisih = beratBaru - beratLama

  try {
    const koreksi = await prisma.$transaction(async (tx) => {
      await tx.stock.update({ where: { id: stockId }, data: { berat: beratBaru } })
      const created = await tx.koreksiStock.create({
        data: {
          stockId,
          beratSebelum: beratLama,
          beratSesudah: beratBaru,
          alasan,
          dilakukanOlehId: auth.user.id,
        },
      })
      await tx.stockMutation.create({
        data: {
          stockId,
          tipe: "ADJUST",
          berat: selisih,
          beratSebelum: beratLama,
          beratSesudah: beratBaru,
          refType: "KOREKSI_STOCK",
          refId: created.id,
          userId: auth.user.id,
          keterangan: alasan,
        },
      })
      await tx.auditLog.create({
        data: {
          userId: auth.user.id,
          aksi: "KOREKSI_STOCK",
          entitas: "Stock",
          entitasId: stockId,
          payloadBefore: { berat: beratLama.toString() },
          payloadAfter: { berat: beratBaru.toString() },
        },
      })
      return created
    })
    return Response.json(koreksi, { status: 201 })
  } catch {
    return Response.json({ error: "gagal menyimpan koreksi stock" }, { status: 400 })
  }
}
