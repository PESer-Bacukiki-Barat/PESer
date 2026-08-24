import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { ChevronRight } from "lucide-react"

import { getServerUser } from "@/lib/auth"
import { ProfilForm, type Profil } from "@/components/profil/profil-form"

export const metadata: Metadata = {
  title: "Profil Saya",
}

export const dynamic = "force-dynamic"

/** FR-A2 untuk admin. Form-nya sama dengan milik petugas, hanya shell-nya beda. */
export default async function ProfilAdminPage() {
  const user = await getServerUser()
  if (!user) redirect("/login")

  const profil: Profil = {
    nama: user.nama,
    email: user.email,
    role: user.role,
    bankSampah: user.bankSampah ? { nama: user.bankSampah.nama } : null,
  }

  return (
    <>
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-2 text-on-surface-variant font-label-sm text-label-sm mb-6"
      >
        <Link className="hover:text-primary transition-colors" href="/admin">
          Dashboard
        </Link>
        <ChevronRight className="size-4" />
        <span className="text-on-surface font-semibold">Profil Saya</span>
      </nav>

      <div className="mb-6">
        <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-2">
          Profil Saya
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
          Ubah nama dan password akun Anda sendiri.
        </p>
      </div>

      <div className="max-w-xl">
        <ProfilForm profil={profil} />
      </div>
    </>
  )
}
