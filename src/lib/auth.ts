import { cache } from "react"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { fail } from "@/lib/response"

export const getServerUser = cache(async () => {
  const session = await auth()
  if (!session?.user?.id) return null

  return prisma.user.findUnique({
    where: { id: session.user.id, deletedAt: null },
    include: { bankSampah: { select: { id: true, nama: true } } },
  })
})

export type AppUser = NonNullable<Awaited<ReturnType<typeof getServerUser>>>

export type AuthResult =
  | { ok: true; user: AppUser }
  | { ok: false; response: Response }

// Guard untuk Route Handler: cek session NextAuth + profil lokal.
// role diisi kalau butuh otorisasi peran (mis. ADMIN).
export async function requireAuth(role?: "ADMIN" | "PETUGAS"): Promise<AuthResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false, response: fail("TIDAK_TERAUTENTIKASI", "Sesi tidak valid") }
  }

  const profile = await prisma.user.findUnique({
    where: { id: session.user.id, deletedAt: null },
    include: { bankSampah: { select: { id: true, nama: true } } },
  })
  if (!profile) {
    return { ok: false, response: fail("TIDAK_TERAUTENTIKASI", "Sesi tidak valid") }
  }
  if (role && profile.role !== role) {
    return {
      ok: false,
      response: fail("AKSES_DITOLAK", `Aksi ini hanya untuk role ${role}`),
    }
  }

  return { ok: true, user: profile }
}
