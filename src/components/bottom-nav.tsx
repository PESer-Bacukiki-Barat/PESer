"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Home, ScanLine, User, Wallet } from "lucide-react";

import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/aktivitas", label: "Aktivitas", icon: Activity },
  { href: "/setor", label: "Setor", icon: ScanLine, elevated: true },
  { href: "/dompet", label: "Dompet", icon: Wallet },
  { href: "/profil", label: "Profil", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigasi utama"
      className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-md border-t border-border bg-card"
    >
      <div className="flex h-16 items-stretch px-2">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          if (item.elevated) {
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                className="relative flex flex-1 items-center justify-center"
              >
                <span
                  className={cn(
                    "absolute -top-5 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md ring-4 ring-card transition-all active:scale-95",
                    isActive && "ring-2 ring-primary/30"
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
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
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
