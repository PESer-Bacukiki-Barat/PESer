"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Building2,
  GraduationCap,
  LayoutDashboard,
  Package,
  ReceiptText,
  User,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

const NAV_ITEMS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Kelurahan", icon: Building2 },
  { href: "/admin/transaksi", label: "Transaksi Sampah", icon: ReceiptText },
  { href: "/admin/inventaris", label: "Inventaris", icon: Package },
  { href: "/admin/laporan", label: "Laporan", icon: BarChart3 },
  { href: "/admin/edukasi", label: "Edukasi", icon: GraduationCap },
];

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center space-x-3 px-3 py-2 rounded-lg font-label-md text-label-md transition-colors",
              active
                ? "bg-primary-container text-on-primary-container"
                : "text-on-surface-variant hover:bg-surface-container-low",
            )}
          >
            <Icon className="size-5 shrink-0" />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

const MOBILE_NAV_ITEMS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/inventaris", label: "Stock", icon: Package },
  { href: "/admin/transaksi", label: "History", icon: ReceiptText },
  { href: "/admin/users", label: "Profile", icon: User },
];

export function AdminMobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-2 bg-surface-container dark:bg-inverse-surface border-t border-outline-variant dark:border-outline rounded-t-xl shadow-md">
      {MOBILE_NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-col items-center justify-center font-label-sm text-label-sm text-on-surface-variant dark:text-surface-variant hover:text-primary dark:hover:text-primary-fixed transition-colors",
              active && "text-primary dark:text-primary-fixed opacity-100",
              !active && "opacity-70",
            )}
          >
            <Icon className="size-6" />
            <span className="mt-1">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
