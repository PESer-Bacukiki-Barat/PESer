"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  BarChart3,
  Bell,
  Building2,
  Contact,
  HelpCircle,
  Landmark,
  LayoutDashboard,
  LogOut,
  Menu,
  ReceiptText,
  Search,
  Settings,
  Shield,
  ShieldUser,
  Tags,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const NAV_ITEMS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/kelurahan", label: "Kelurahan", icon: Building2 },
  { href: "/admin/bank-sampah", label: "Bank Sampah", icon: Landmark },
  { href: "/admin/users", label: "Users", icon: ShieldUser },
  { href: "/admin/pembeli", label: "Pembeli", icon: Users },
  { href: "/admin/nasabah", label: "Nasabah", icon: Contact },
  { href: "/admin/jenis-sampah", label: "Jenis Sampah", icon: Tags },
  { href: "/admin/transaksi", label: "Transaksi", icon: ReceiptText },
  { href: "/admin/laporan", label: "Laporan", icon: BarChart3 },
  { href: "/admin/bantuan", label: "Bantuan", icon: HelpCircle },
];

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

function AdminSidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 overflow-y-auto px-4 space-y-1 font-label-md text-label-md">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
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

export function AdminShell({ children }: { children: ReactNode }) {
  const currentPathname = usePathname();
  const [prevPathname, setPrevPathname] = useState(currentPathname);
  const [isOpen, setIsOpen] = useState(false);

  if (prevPathname !== currentPathname) {
    setPrevPathname(currentPathname);
    setIsOpen(false);
  }

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      {/* TopNavBar */}
      <nav className="fixed top-0 w-full z-50 bg-surface border-b border-outline-variant flex items-center justify-between px-4 md:px-6 h-16">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="md:hidden -ml-2"
            onClick={() => setIsOpen(true)}
            aria-label="Buka menu"
            aria-expanded={isOpen}
          >
            <Menu className="size-5" />
          </Button>
          <span className="font-headline-md text-headline-md font-bold text-primary">PESer</span>
          <div className="relative w-full max-w-sm hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant size-4" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full h-10 pl-10 pr-4 rounded-full bg-surface-container-low border-transparent focus:border-primary focus:ring-1 focus:ring-primary text-sm text-on-surface placeholder:text-on-surface-variant outline-none transition-all"
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 w-1/3">
          <Button type="button" variant="ghost" size="icon" aria-label="Notifications">
            <Bell className="size-5" />
          </Button>
          <Button type="button" variant="ghost" size="icon" aria-label="Settings">
            <Settings className="size-5" />
          </Button>
          <div className="w-8 h-8 rounded-full overflow-hidden ml-2 cursor-pointer border border-outline-variant hover:border-primary transition-colors flex items-center justify-center bg-primary-container text-primary font-label-md text-label-md">
            AP
          </div>
        </div>
      </nav>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* SideNavBar */}
      <aside
        className={cn(
          "fixed left-0 top-0 md:top-16 w-64 bg-surface-container-low border-r border-outline-variant flex flex-col py-6 gap-y-2 z-50 md:z-40 h-dvh md:h-[calc(100vh-64px)]",
          "transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        <div className="px-4 md:px-6 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-lg">
              P
            </div>
            <div>
              <h2 className="font-label-md text-label-md font-bold text-on-surface">PESer Admin</h2>
              <p className="font-label-sm text-label-sm text-on-surface-variant">Waste Management</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label="Tutup menu"
            className="md:hidden p-2 rounded-full hover:bg-surface-container-low text-on-surface-variant transition-colors active:opacity-80"
          >
            <X className="size-5" />
          </button>
        </div>

        <AdminSidebarNav onNavigate={() => setIsOpen(false)} />

        <div className="px-4 mt-auto space-y-1">
          <a
            href="/admin/privacy"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-all duration-200 font-label-md text-label-md"
          >
            <Shield className="size-5 shrink-0" />
            <span>Privacy Policy</span>
          </a>
          <Button type="button" variant="destructive" className="w-full mt-4">
            <LogOut className="size-5" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex pt-16">
        <main className="flex-1 md:ml-64 p-4 md:p-8 bg-background min-h-[calc(100vh-64px)] overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
