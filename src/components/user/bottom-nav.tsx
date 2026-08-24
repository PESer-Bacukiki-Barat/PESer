"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Home, Recycle, UserRound } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Bottom tab bar area warga — DESIGN.md "Navigation": Home, Activity, Scan
 * elevated di tengah, Wallet, Profile. Slot dompet dihapus: PRD §1.3 tidak
 * punya fitur dompet/poin untuk warga, jadi tabnya diganti profil.
 */
const NAV_ITEMS = [
  { href: "/", label: "Beranda", icon: Home },
  { href: "/aktivitas", label: "Aktivitas", icon: Activity },
  { href: "/setor", label: "Setor", icon: Recycle, elevated: true },
  { href: "/profil", label: "Profil", icon: UserRound },
];

export function UserBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigasi utama"
      className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-md border-t border-outline-variant bg-surface-container-lowest"
    >
      <div className="flex h-16 items-stretch px-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          // /setor adalah satu-satunya halaman tanpa tab aktif; tombol elevated
          // tetap menyala supaya arah "aksi utama" selalu terlihat.
          const isActive =
            item.elevated || pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));

          if (item.elevated) {
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                aria-current={pathname === item.href ? "page" : undefined}
                className="relative flex flex-1 items-center justify-center"
              >
                <span
                  className={cn(
                    "absolute -top-5 flex size-14 items-center justify-center rounded-full bg-primary text-on-primary shadow-md ring-4 ring-surface-container-lowest transition-all active:scale-95",
                    pathname === item.href && "ring-2 ring-primary/30",
                  )}
                >
                  <Icon className="size-6" />
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                // Target sentuh penuh tinggi bar (≥ TARGET_SENTUH_MIN_PX).
                "flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-lg",
                isActive
                  ? "text-primary font-semibold"
                  : "text-on-surface-variant hover:text-on-surface",
              )}
            >
              <Icon className="size-5" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
