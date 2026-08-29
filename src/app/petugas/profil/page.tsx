import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { getServerUser } from "@/lib/auth"
import { ProfilForm, type Profil } from "@/components/profil/profil-form"
import { PenukarTema } from "@/components/ui/penukar-tema"

export const metadata: Metadata = {
  title: "Profil Saya",
}

export const dynamic = "force-dynamic"

/** FR-A2 untuk petugas — inilah jalur rotasi password awal mereka. */
/**
 * Tema ditaruh di halaman profil, bukan di header: header petugas sudah padat
 * (nama, bank sampah, badge antrean, lonceng, keluar) dan ruangnya sempit di
 * HP. Tema pun bukan sesuatu yang diubah sambil bekerja di lapangan.
 */
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

      <section className="mt-4 rounded-xl border border-outline-variant bg-surface-container-lowest p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-label-md text-label-md font-semibold text-on-surface">
              Tampilan
            </h2>
            <p className="mt-0.5 font-label-sm text-label-sm text-on-surface-variant">
              Tema gelap membantu saat bekerja malam atau baterai menipis.
            </p>
          </div>
          <PenukarTema className="shrink-0" />
        </div>
      </section>
    </>
  )
}
