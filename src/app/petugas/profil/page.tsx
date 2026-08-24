import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { getServerUser } from "@/lib/auth"
import { ProfilForm, type Profil } from "@/components/profil/profil-form"

export const metadata: Metadata = {
  title: "Profil Saya",
}

export const dynamic = "force-dynamic"

/** FR-A2 untuk petugas — inilah jalur rotasi password awal mereka. */
export default async function ProfilPetugasPage() {
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
      <div className="mb-4">
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
          Profil Saya
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant mt-1">
          Ganti nama dan password akun Anda.
        </p>
      </div>
      <ProfilForm profil={profil} />
    </>
  )
}
