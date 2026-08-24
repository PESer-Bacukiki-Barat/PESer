import { prisma } from "@/lib/prisma"
import { dispatchSchema } from "../schema"
import { requireAuth } from "@/lib/auth"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  const { id } = await params
  const data = await prisma.dispatch.findUnique({
    where: { id },
    include: {
      bankSampah: true,
      pembeli: true,
      items: { include: { jenisSampah: true } },
    },
  })
  if (!data) return Response.json({ error: "tidak ditemukan" }, { status: 404 })
  return Response.json(data)
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  const { id } = await params
  const parsed = dispatchSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues }, { status: 400 })
  }
  try {
    const data = await prisma.dispatch.update({
      where: { id },
      data: {
        kodeDispatch: parsed.data.kodeDispatch,
        bankSampahId: parsed.data.bankSampahId,
        pembeliId: parsed.data.pembeliId,
        tanggalJemput: parsed.data.tanggalJemput,
        totalNilai: parsed.data.totalNilai,
        alasanTolak: parsed.data.alasanTolak,
        alasanSelisih: parsed.data.alasanSelisih,
        selisihSignifikan: parsed.data.selisihSignifikan,
        items: {
          deleteMany: {},
          create: parsed.data.items.map((i) => ({
            jenisSampahId: i.jenisSampahId,
            beratTarget: i.beratTarget,
            hargaJualPerKg: i.hargaJualPerKg,
          })),
        },
      },
    })
    return Response.json(data)
   } catch {
     return Response.json({ error: "tidak ditemukan" }, { status: 404 })
   }
 }
 
 export async function DELETE(
   _request: Request,
   { params }: { params: Promise<{ id: string }> },
 ) {
   const auth = await requireAuth("ADMIN")
   if (!auth.ok) return auth.response
   const { id } = await params
 
   try {
     const existing = await prisma.dispatch.findUnique({
       where: { id },
       include: { items: true },
     })
     if (!existing || existing.deletedAt) {
       return Response.json({ error: "tidak ditemukan" }, { status: 404 })
     }
 
     await prisma.$transaction(async (tx) => {
       await tx.dispatch.update({
         where: { id },
         data: { deletedAt: new Date() },
       })
       await tx.auditLog.create({
         data: {
           userId: auth.user.id,
           aksi: "HAPUS_DISPATCH",
           entitas: "Dispatch",
           entitasId: id,
           payloadBefore: JSON.parse(JSON.stringify(existing)),
           payloadAfter: null,
         },
       })
     })
 
     return Response.json({ success: true, data: { id } }, { status: 200 })
   } catch {
     return Response.json({ error: "gagal menghapus dispatch" }, { status: 400 })
   }
 }
