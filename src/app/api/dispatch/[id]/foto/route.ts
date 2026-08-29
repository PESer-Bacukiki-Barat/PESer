import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { created, noContent, fail } from "@/lib/response"
import { tulisAudit } from "@/lib/audit"
import { pelakuBoleh } from "@/lib/dispatch-aksi"
import {
  MAKS_UKURAN_FOTO_BYTE,
  TIPE_FOTO_DIIZINKAN,
} from "@/lib/constants"

/**
 * Foto bukti serah terima — FR-D5, BR-19.
 *
 * Isinya disimpan di Postgres (lihat baris Storage di PRD §8): Vercel
 * serverless tidak punya filesystem persisten, dan §8.1 melarang menambah
 * dependency besar seperti SDK object storage.
 *
 * Endpoint ini SENGAJA terpisah dari /serah-terima. Petugas bekerja dari HP di
 * lapangan; menyandera perpindahan status pada unggahan yang bisa gagal akan
 * membuat barang yang sudah fisik berpindah tidak tercatat. Foto boleh
 * menyusul, selama dispatch-nya belum final.
 *
 * Kalau kelak volumenya menuntut object storage, yang berubah hanya isi berkas
 * ini — pemanggilnya tetap memakai URL yang sama.
 */

/**
 * Status yang boleh menerima/mengubah foto.
 *
 * DITERIMA: petugas sudah memegang barang, boleh memotret sebelum serah terima.
 * SERAH_TERIMA: momen resminya.
 * SELESAI dan DIBATALKAN sengaja TIDAK termasuk — BR-13 menetapkan SELESAI
 * final, dan laporan tidak boleh berubah retroaktif termasuk bukti fotonya.
 */
const STATUS_BOLEH_UNGGAH = ["DITERIMA", "SERAH_TERIMA"] as const

type Ctx = { params: Promise<{ id: string }> }

/** Dispatch + hak akses pemanggil. Dipakai ketiga handler. */
async function ambil(id: string, user: Awaited<ReturnType<typeof requireAuth>>) {
  if (!user.ok) return { ok: false as const, response: user.response }

  const dispatch = await prisma.dispatch.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, kodeDispatch: true, status: true, bankSampahId: true },
  })
  if (!dispatch) {
    return { ok: false as const, response: fail("TIDAK_DITEMUKAN", "Dispatch tidak ditemukan") }
  }
  return { ok: true as const, dispatch, user: user.user }
}

/**
 * GET — sajikan fotonya.
 *
 * Boleh dilihat ADMIN (untuk verifikasi sebelum menutup dispatch, FR-D6) dan
 * PETUGAS pemilik. Aturan pelakunya memakai `pelakuBoleh` yang sama dengan
 * state machine §8.2, bukan menulis ulang definisi "pemilik" untuk kedua kali.
 */
export async function GET(_req: Request, ctx: Ctx) {
  const auth = await requireAuth()
  const { id } = await ctx.params
  const hasil = await ambil(id, auth)
  if (!hasil.ok) return hasil.response

  const { dispatch, user } = hasil
  const bolehLihat =
    pelakuBoleh("ADMIN", user, dispatch.bankSampahId) ||
    pelakuBoleh("PETUGAS_PEMILIK", user, dispatch.bankSampahId)
  if (!bolehLihat) {
    return fail("AKSES_DITOLAK", "Foto ini bukan milik bank sampah Anda")
  }

  const foto = await prisma.fotoBukti.findUnique({
    where: { dispatchId: id },
    select: { data: true, mimeType: true, ukuran: true, createdAt: true },
  })
  if (!foto) return fail("TIDAK_DITEMUKAN", "Dispatch ini belum punya foto bukti")

  // Bukan JSON, jadi amplop §2.5 tidak berlaku — sama seperti unduhan CSV.
  return new Response(new Uint8Array(foto.data), {
    headers: {
      "Content-Type": foto.mimeType,
      "Content-Length": String(foto.ukuran),
      // Isinya tidak pernah berubah untuk dispatch yang sama (unggah ulang
      // membuat baris baru dengan Last-Modified baru), tapi ia data privat —
      // jadi hanya cache di perangkat pemiliknya.
      "Cache-Control": "private, max-age=3600",
      "Last-Modified": foto.createdAt.toUTCString(),
      // Mencegah browser menebak tipe lain dari isinya.
      "X-Content-Type-Options": "nosniff",
      "Content-Disposition": `inline; filename="bukti-${dispatch.kodeDispatch}"`,
    },
  })
}

/**
 * POST — unggah / ganti foto. PETUGAS pemilik saja (FR-D5): dialah yang berada
 * di lokasi saat barang berpindah.
 *
 * Body = berkas mentah, dengan Content-Type sebagai tipenya. Sengaja bukan
 * multipart: hanya ada satu berkas, dan raw body menghemat parsing serta
 * beberapa kilobyte boundary pada koneksi lapangan.
 */
export async function POST(request: Request, ctx: Ctx) {
  const auth = await requireAuth()
  const { id } = await ctx.params
  const hasil = await ambil(id, auth)
  if (!hasil.ok) return hasil.response

  const { dispatch, user } = hasil
  if (!pelakuBoleh("PETUGAS_PEMILIK", user, dispatch.bankSampahId)) {
    return fail("AKSES_DITOLAK", "Hanya petugas bank sampah ini yang boleh mengunggah")
  }

  if (!STATUS_BOLEH_UNGGAH.includes(dispatch.status as (typeof STATUS_BOLEH_UNGGAH)[number])) {
    return fail(
      "TRANSISI_TIDAK_VALID",
      `Foto bukti hanya bisa diunggah saat dispatch DITERIMA atau SERAH_TERIMA, bukan ${dispatch.status}`,
    )
  }

  const mimeType = (request.headers.get("content-type") ?? "").split(";")[0].trim()
  if (!TIPE_FOTO_DIIZINKAN.includes(mimeType as (typeof TIPE_FOTO_DIIZINKAN)[number])) {
    return fail(
      "VALIDASI_GAGAL",
      `Tipe berkas harus salah satu dari: ${TIPE_FOTO_DIIZINKAN.join(", ")}`,
      { field: "Content-Type" },
    )
  }

  const isi = Buffer.from(await request.arrayBuffer())
  if (isi.byteLength === 0) {
    return fail("VALIDASI_GAGAL", "Berkas kosong", { field: "file" })
  }
  // Dicek dari isi yang benar-benar diterima, bukan dari header Content-Length
  // yang bisa berbohong.
  if (isi.byteLength > MAKS_UKURAN_FOTO_BYTE) {
    return fail(
      "VALIDASI_GAGAL",
      `Ukuran foto maksimal ${Math.round(MAKS_UKURAN_FOTO_BYTE / 1024)} KB, diterima ${Math.round(isi.byteLength / 1024)} KB`,
      { field: "file" },
    )
  }

  const foto = await prisma.$transaction(async (tx) => {
    const baris = await tx.fotoBukti.upsert({
      where: { dispatchId: id },
      create: {
        dispatchId: id,
        mimeType,
        ukuran: isi.byteLength,
        data: isi,
        diunggahOlehId: user.id,
      },
      update: {
        mimeType,
        ukuran: isi.byteLength,
        data: isi,
        diunggahOlehId: user.id,
      },
      select: { id: true, ukuran: true, mimeType: true, createdAt: true },
    })

    // fotoBuktiUrl adalah penanda "ada foto" sekaligus alamatnya, jadi ia
    // ditulis di transaksi yang sama — kalau tidak, kolom itu bisa menunjuk
    // foto yang gagal tersimpan.
    await tx.dispatch.update({
      where: { id },
      data: { fotoBuktiUrl: `/api/dispatch/${id}/foto` },
    })

    // §2.5 aturan 2: setiap endpoint tulis menulis AuditLog di transaksi yang
    // sama. Isi berkasnya sendiri tidak ikut — yang berguna adalah jejak siapa
    // mengunggah apa, bukan satu megabyte biner di dalam log.
    await tulisAudit(tx, {
      operasi: "UBAH",
      entitas: "Dispatch",
      entitasId: id,
      userId: user.id,
      after: {
        fotoBukti: {
          mimeType: baris.mimeType,
          ukuran: baris.ukuran,
          kodeDispatch: dispatch.kodeDispatch,
        },
      },
    })

    return baris
  })

  return created({
    url: `/api/dispatch/${id}/foto`,
    mimeType: foto.mimeType,
    ukuran: foto.ukuran,
  })
}

/**
 * DELETE — hapus foto (mis. salah ambil, wajah warga ikut terpotret).
 *
 * Hard delete, berbeda dari BR-17 yang mengatur master data: ini berkas biner,
 * dan menyimpan foto yang justru diminta dihapus akan melawan tujuannya.
 * Jejaknya tetap ada di AuditLog.
 */
export async function DELETE(_req: Request, ctx: Ctx) {
  const auth = await requireAuth()
  const { id } = await ctx.params
  const hasil = await ambil(id, auth)
  if (!hasil.ok) return hasil.response

  const { dispatch, user } = hasil
  if (!pelakuBoleh("PETUGAS_PEMILIK", user, dispatch.bankSampahId)) {
    return fail("AKSES_DITOLAK", "Hanya petugas bank sampah ini yang boleh menghapus")
  }
  if (!STATUS_BOLEH_UNGGAH.includes(dispatch.status as (typeof STATUS_BOLEH_UNGGAH)[number])) {
    return fail(
      "TRANSISI_TIDAK_VALID",
      `Foto bukti sudah terkunci pada status ${dispatch.status}`,
    )
  }

  const ada = await prisma.fotoBukti.findUnique({
    where: { dispatchId: id },
    select: { id: true },
  })
  if (!ada) return fail("TIDAK_DITEMUKAN", "Dispatch ini belum punya foto bukti")

  await prisma.$transaction(async (tx) => {
    await tx.fotoBukti.delete({ where: { dispatchId: id } })
    await tx.dispatch.update({ where: { id }, data: { fotoBuktiUrl: null } })
    await tulisAudit(tx, {
      operasi: "HAPUS",
      entitas: "Dispatch",
      entitasId: id,
      userId: user.id,
      before: { fotoBukti: { kodeDispatch: dispatch.kodeDispatch } },
    })
  })

  return noContent()
}
