import bcrypt from "bcryptjs"

import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { ok, fail, failValidation } from "@/lib/response"
import { denganAudit } from "@/lib/audit"
import { profilSchema } from "./schema"

/** Bentuk profil yang boleh dilihat pemiliknya — tanpa apa pun dari Credential. */
const profilSelect = {
  id: true,
  nama: true,
  email: true,
  role: true,
  bankSampah: { select: { id: true, nama: true } },
} as const

/** GET /api/profil — profil sendiri. */
export async function GET() {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  const data = await prisma.user.findUnique({
    where: { id: auth.user.id },
    select: profilSelect,
  })
  if (!data) return fail("TIDAK_DITEMUKAN", "Profil tidak ditemukan")
  return ok(data)
}

/**
 * PATCH /api/profil — FR-A2 "Ubah profil & password sendiri" (ADMIN, PETUGAS).
 *
 * Sebelum endpoint ini ada, satu-satunya jalur ubah password adalah
 * PUT /api/users/[id] yang menuntut ADMIN — artinya petugas tidak bisa
 * merotasi password awalnya sendiri.
 *
 * Kunci keamanannya: password lama WAJIB diverifikasi ulang meski sesi sudah
 * valid. Tanpa itu, siapa pun yang sempat memakai perangkat yang masih login
 * bisa mengambil alih akun secara permanen.
 */
export async function PATCH(request: Request) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  const parsed = profilSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return failValidation(parsed.error.issues)
  const { nama, passwordLama, passwordBaru } = parsed.data

  let passwordHashBaru: string | undefined

  if (passwordBaru && passwordLama) {
    const credential = await prisma.credential.findUnique({
      where: { userId: auth.user.id },
      select: { id: true, passwordHash: true, deletedAt: true },
    })
    if (!credential || credential.deletedAt) {
      return fail("TIDAK_DITEMUKAN", "Kredensial tidak ditemukan")
    }

    const cocok = await bcrypt.compare(passwordLama, credential.passwordHash)
    if (!cocok) {
      // Divalidasi terhadap database, bukan oleh Zod — tapi tetap kegagalan
      // input, jadi memakai kode yang sama seperti pengecekan FK manual.
      return fail("VALIDASI_GAGAL", "Password lama salah", { field: "passwordLama" })
    }

    passwordHashBaru = await bcrypt.hash(passwordBaru, 10)
  }

  const sebelum = { id: auth.user.id, nama: auth.user.nama }

  const data = await denganAudit(
    { operasi: "UBAH", entitas: "User", userId: auth.user.id },
    async (tx) => {
      if (passwordHashBaru) {
        await tx.credential.update({
          where: { userId: auth.user.id },
          data: { passwordHash: passwordHashBaru },
        })
      }
      // Selalu update supaya audit punya baris "after" walaupun hanya password
      // yang berubah; updatedAt ikut bergerak sebagai jejak waktu perubahan.
      return tx.user.update({
        where: { id: auth.user.id },
        data: { ...(nama !== undefined ? { nama } : {}) },
        select: profilSelect,
      })
    },
    () => Promise.resolve(sebelum),
  )

  const res = ok(data)
  if (passwordHashBaru) {
    // JWT tidak punya penyimpanan sesi di server, jadi sesi lain di perangkat
    // lain tetap hidup sampai tokennya kedaluwarsa. Ditandai supaya klien bisa
    // memberi tahu pengguna, bukan diam-diam.
    res.headers.set("Password-Changed", "true")
  }
  return res
}
