import { cache } from "react"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"

export const getServerUser = cache(async () => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  return prisma.user.findFirst({
    where: { authUserId: user.id, deletedAt: null },
    include: { bankSampah: { select: { id: true, nama: true } } },
  })
})

export type AppUser = NonNullable<Awaited<ReturnType<typeof getServerUser>>>

export type AuthResult =
  | { ok: true; user: AppUser; authUserId: string }
  | { ok: false; response: Response }

// Guard untuk Route Handler: cek session Supabase + profil lokal.
// role diisi kalau butuh otorisasi peran (mis. ADMIN).
export async function requireAuth(role?: "ADMIN" | "PETUGAS"): Promise<AuthResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false, response: Response.json({ error: "unauthorized" }, { status: 401 }) }
  }

  const profile = await prisma.user.findFirst({
    where: { authUserId: user.id, deletedAt: null },
    include: { bankSampah: { select: { id: true, nama: true } } },
  })
  if (!profile) {
    return { ok: false, response: Response.json({ error: "unauthorized" }, { status: 401 }) }
  }
  if (role && profile.role !== role) {
    return { ok: false, response: Response.json({ error: "forbidden" }, { status: 403 }) }
  }

  return { ok: true, user: profile, authUserId: user.id }
}
