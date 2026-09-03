"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Package, Scale, Truck, History } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Navigasi bawah untuk petugas.
 *
 * Mengikuti pola BottomNav milik aplikasi nasabah (tombol tengah ditinggikan)
 * supaya bahasa visualnya konsisten, tapi rutenya milik petugas sendiri.
 * Target sentuh mengikuti TARGET_SENTUH_MIN_PX (§8.7): tinggi bar 64px dan
 * setiap tombol mengisi tinggi penuh.
 */
const ITEM = [
  { href: "/petugas", label: "Beranda", icon: Home },
  { href: "/petugas/stock", label: "Stock", icon: Package },
  { href: "/petugas/setor", label: "Setor", icon: Scale, utama: true },
  { href: "/petugas/dispatch", label: "Dispatch", icon: Truck },
  { href: "/petugas/riwayat", label: "Riwayat", icon: History },
]

export function PetugasNav() {
  const pathname = usePathname()

  /** Beranda hanya aktif kalau persis /petugas, bukan setiap subrute. */
  const aktif = (href: string) =>
    href === "/petugas" ? pathname === href : pathname.startsWith(href)

  return (
    <nav
      aria-label="Navigasi petugas"
      className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-md border-t border-outline-variant bg-surface-container-lowest pt-aman-bawah"
    >
      <ul className="flex h-16 items-stretch px-2">
        {ITEM.map((item) => {
          const isAktif = aktif(item.href)
          const Icon = item.icon

          if (item.utama) {
            return (
              <li key={item.href} className="relative flex flex-1 justify-center">
                <Link
                  href={item.href}
                  aria-label={item.label}
                  aria-current={isAktif ? "page" : undefined}
                  className="absolute -top-5 flex size-14 items-center justify-center rounded-full bg-primary text-on-primary shadow-md ring-4 ring-surface-container-lowest transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/50"
                >
                  <Icon className="size-6" aria-hidden />
                </Link>
                <span className="mt-auto mb-2 font-label-sm text-label-sm text-on-surface-variant">
                  {item.label}
                </span>
              </li>
            )
          }

          return (
            <li key={item.href} className="flex flex-1">
              <Link
                href={item.href}
                aria-current={isAktif ? "page" : undefined}
                className={cn(
                  "tekan-halus flex flex-1 flex-col items-center justify-center gap-0.5 rounded-lg focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/50",
                  isAktif ? "text-primary" : "text-on-surface-variant hover:text-on-surface",
                )}
              >
                {/* Penanda aktif. Sebelumnya keadaan aktif hanya dibedakan
                    warna dan ketebalan huruf; pil ini membuat posisi terbaca
                    di penglihatan tepi tanpa perlu membaca labelnya. Padding
                    selalu terpasang dan hanya latarnya yang berubah, jadi
                    tidak ada geseran tata letak saat berpindah tab. Pasangan
                    container/on-container menjamin kontrasnya di terang
                    maupun gelap. */}
                <span
                  className={cn(
                    "flex items-center justify-center rounded-full px-3 py-0.5 transition-colors duration-fast",
                    isAktif && "bg-secondary-container text-on-secondary-container",
                  )}
                >
                  <Icon className="size-5" aria-hidden />
                </span>
                <span className="font-label-sm text-label-sm">{item.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
