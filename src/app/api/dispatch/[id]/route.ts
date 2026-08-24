import { prisma } from "@/lib/prisma"
import { dispatchSchema } from "../schema"
import { requireAuth } from "@/lib/auth"
import { ok, fail, failValidation } from "@/lib/response"
import { BOLEH_REVISI } from "@/lib/dispatch-aksi"

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
  if (!data) return fail("TIDAK_DITEMUKAN", "Data tidak ditemukan")
  return ok(data)
}

/**
 * PUT /api/dispatch/[id] — revisi isi dispatch (bukan transisi status).
 *
 * Perubahan status HANYA lewat endpoint aksi /terbitkan, /terima, /tolak,
 * /serah-terima, /tutup, /batalkan yang memakai transisiDispatch() (§8.2
 * mewajibkan satu state machine). Karena itu skema di sini tidak punya field
 * status, dan revisi hanya diizinkan selama dispatch masih DRAFT atau DITOLAK
 * (§8.2 "DITOLAK -> DRAFT: revisi target"). BR-13: SELESAI final.
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuth("ADMIN")
  if (!auth.ok) return auth.response
  const { id } = await params
  const parsed = dispatchSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return failValidation(parsed.error.issues)
  }

  const sekarang = await prisma.dispatch.findFirst({
    where: { id, deletedAt: null },
    select: { status: true },
  })
  if (!sekarang) return fail("TIDAK_DITEMUKAN", "Dispatch tidak ditemukan")
  if (!BOLEH_REVISI.includes(sekarang.status)) {
    return fail(
      "TRANSISI_TIDAK_VALID",
      `Dispatch berstatus ${sekarang.status} tidak bisa direvisi`,
    )
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
    return ok(data)
   } catch {
     return fail("TIDAK_DITEMUKAN", "Data tidak ditemukan")
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
       return fail("TIDAK_DITEMUKAN", "Data tidak ditemukan")
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
           // payloadAfter sengaja tidak di-set: field Json? menolak null literal
           // (butuh Prisma.DbNull), dan dispatch terhapus tak punya state sesudah.
         },
       })
     })
 
     return ok({ id })
   } catch {
     return fail("PERMINTAAN_GAGAL", "gagal menghapus dispatch")
   }
 }
