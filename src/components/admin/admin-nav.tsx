"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  BarChart3,
  Building2,
  Contact,
  HelpCircle,
  Landmark,
  LayoutDashboard,
  LogOut,
  Map as MapIcon,
  Menu,
  ReceiptText,
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
import { logout } from "@/app/actions/auth";
import { LogoPeser } from "@/components/brand/logo-peser";
import { LoncengNotifikasi } from "@/components/notifikasi/lonceng-notifikasi";

const NAV_ITEMS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/kelurahan", label: "Kelurahan", icon: Building2 },
  { href: "/admin/bank-sampah", label: "Bank Sampah", icon: Landmark },
  { href: "/admin/users", label: "Users", icon: ShieldUser },
  { href: "/admin/pembeli", label: "Pembeli", icon: Users },
  { href: "/admin/nasabah", label: "Nasabah", icon: Contact },
  { href: "/admin/jenis-sampah", label: "Jenis Sampah", icon: Tags },
  { href: "/admin/transaksi", label: "Transaksi", icon: ReceiptText },
  { href: "/admin/profil", label: "Profil", icon: Settings },
  { href: "/admin/laporan", label: "Laporan", icon: BarChart3 },
  { href: "/admin/peta", label: "Peta Sebaran", icon: MapIcon },
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
              "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-fast",
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

/** Inisial dari nama, maksimal dua huruf. */
function inisial(nama: string): string {
  return (
    nama
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

/** Judul halaman aktif, diambil dari daftar navigasi yang sudah ada. */
function judulHalaman(pathname: string): string {
  const cocok = [...NAV_ITEMS]
    .filter((i) => isActive(pathname, i.href))
    .sort((a, b) => b.href.length - a.href.length)[0];
  return cocok?.label ?? "Admin";
}

export function AdminShell({
  children,
  nama,
  email,
}: {
  children: ReactNode;
  nama: string;
  email: string;
}) {
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
          {/* Kotak pencarian dan tombol Settings dihapus dari sini: keduanya
              tidak punya handler sama sekali — kontrol yang berpura-pura
              bekerja lebih menyesatkan daripada tidak ada. Pengaturan akun
              sudah punya tempatnya sendiri di /admin/profil, yang kini bisa
              dicapai lewat kartu identitas di kanan. */}
          <LogoPeser ukuran="sm" className="md:hidden" />
          <span className="hidden font-headline-md text-headline-md font-bold text-on-surface md:inline">
            {judulHalaman(currentPathname)}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <LoncengNotifikasi />
          <Link
            href="/admin/profil"
            className="flex items-center gap-2 rounded-full border border-outline-variant py-1 pr-3 pl-1 transition-colors duration-fast hover:bg-surface-container-high focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/50"
          >
            <span
              aria-hidden
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-container font-label-sm text-label-sm font-semibold text-on-primary-container"
            >
              {inisial(nama)}
            </span>
            <span className="hidden min-w-0 text-left sm:block">
              <span className="block truncate font-label-md text-label-md text-on-surface">
                {nama}
              </span>
              <span className="block truncate font-label-sm text-label-sm text-on-surface-variant">
                {email}
              </span>
            </span>
          </Link>
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
          {/* Lambang yang SAMA dengan layar masuk. Sebelumnya di sini huruf
              "P" dalam kotak, di login ikon daur ulang — dua identitas berbeda
              untuk satu produk. Subjudulnya juga berbahasa Inggris. */}
          <LogoPeser ukuran="sm" tampilkanSubjudul />
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label="Tutup menu"
            className="md:hidden p-2 rounded-full hover:bg-surface-container-low text-on-surface-variant transition-colors active:opacity-80 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/50"
          >
            <X className="size-5" />
          </button>
        </div>

        <AdminSidebarNav onNavigate={() => setIsOpen(false)} />

        <div className="px-4 mt-auto space-y-1">
          <a
            href="/admin/privacy"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors duration-fast font-label-md text-label-md"
          >
            <Shield className="size-5 shrink-0" />
            <span>Privacy Policy</span>
          </a>
          <form action={logout}>
            <Button type="submit" variant="destructive" className="w-full mt-4">
              <LogOut className="size-5" />
              Logout
            </Button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex pt-16">
        <main className="masuk flex-1 md:ml-64 p-4 md:p-8 bg-background min-h-[calc(100vh-64px)] overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
