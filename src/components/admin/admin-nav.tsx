"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Building2,
  HelpCircle,
  LayoutDashboard,
  ReceiptText,
  ShieldUser,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

const NAV_ITEMS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/kelurahan", label: "Kelurahan", icon: Building2 },
  { href: "/admin/petugas", label: "Petugas", icon: ShieldUser },
  { href: "/admin/transaksi", label: "Transaksi", icon: ReceiptText },
  { href: "/admin/laporan", label: "Laporan", icon: BarChart3 },
  { href: "/admin/bantuan", label: "Bantuan", icon: HelpCircle },
];

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 overflow-y-auto px-4 space-y-1 font-label-md text-label-md">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
              active
                ? "bg-secondary-container text-on-secondary-container font-semibold"
                : "text-on-surface-variant hover:bg-surface-container-high",
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
