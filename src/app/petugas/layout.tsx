import Link from "next/link"
import { redirect } from "next/navigation"

import { getServerUser } from "@/lib/auth"
import { logout } from "@/app/actions/auth"
import { PetugasNav } from "@/components/petugas/petugas-nav"
import { AntreanProvider } from "@/components/petugas/antrean-provider"
import { BadgeAntrean, TombolKeluar } from "@/components/petugas/bar-antrean"

/**
 * Shell aplikasi petugas — mobile-first (PRD: petugas bekerja dari HP di
 * lapangan). Middleware sudah menutup /petugas/** untuk non-PETUGAS; di sini
 * yang dijaga adalah syarat BR-02: petugas wajib terikat satu bank sampah,
 * karena seluruh halaman di bawah ini di-scope ke bank sampah itu.
 */
export default async function PetugasLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getServerUser()
  if (!user) redirect("/login")
  if (user.role !== "PETUGAS") redirect("/dashboard")

  if (!user.bankSampah) {
    return (
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-10">
        <div className="rounded-xl border border-error bg-error-container/40 p-5">
          <h1 className="font-headline-md text-[18px] font-semibold text-on-error-container mb-1">
            Belum ditugaskan
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Akun Anda belum terikat ke bank sampah mana pun, jadi setoran dan stock
            belum bisa dibuka. Hubungi admin kecamatan untuk penugasan (BR-02).
          </p>
          <form action={logout} className="mt-4">
            <button
              type="submit"
              className="h-11 w-full rounded-lg border border-outline-variant font-label-md text-label-md text-on-surface transition-colors hover:bg-surface-container-low"
            >
              Keluar
            </button>
          </form>
        </div>
      </main>
    )
  }

  return (
    // Provider membungkus seluruh area petugas supaya badge di header dan form
    // setoran memakai satu antrean yang sama (§4.3 aturan 5).
    <AntreanProvider>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
      <header className="sticky top-0 z-40 border-b border-outline-variant bg-surface-container-lowest/95 backdrop-blur">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          {/* Header sekaligus jalan masuk ke profil: bottom nav sudah penuh
              lima item, dan menambah item keenam akan menyempitkan target
              sentuh di bawah TARGET_SENTUH_MIN_PX. */}
          <Link
            href="/petugas/profil"
            className="min-w-0 rounded-lg px-1 -mx-1 transition-colors hover:bg-surface-container-low focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/50"
          >
            <p className="font-label-sm text-label-sm text-on-surface-variant">
              {user.nama}
            </p>
            <p className="font-headline-md text-[16px] font-semibold text-on-surface truncate">
              {user.bankSampah.nama}
            </p>
          </Link>
          <div className="flex shrink-0 items-center gap-2">
            <BadgeAntrean />
            <TombolKeluar />
          </div>
        </div>
      </header>

      {/* pb-24 memberi ruang untuk bottom nav yang fixed */}
      <main className="flex-1 px-4 pt-4 pb-24">{children}</main>

      <PetugasNav />
      </div>
    </AntreanProvider>
  )
}
