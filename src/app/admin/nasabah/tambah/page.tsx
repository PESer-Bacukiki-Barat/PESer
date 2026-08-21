import type { Metadata } from "next";
import { ChevronRight } from "lucide-react";

import { NasabahForm } from "@/components/admin/nasabah-form";

export const metadata: Metadata = {
  title: "Tambah Nasabah",
};

export default function TambahNasabahPage() {
  return (
    <>
      {/* Breadcrumbs */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-2 text-on-surface-variant font-label-sm text-label-sm mb-6"
      >
        <a className="hover:text-primary transition-colors" href="/admin">
          Dashboard
        </a>
        <ChevronRight className="size-4" />
        <a className="hover:text-primary transition-colors" href="/admin/nasabah">
          Manajemen Nasabah
        </a>
        <ChevronRight className="size-4" />
        <span className="text-on-surface font-semibold">Tambah Nasabah</span>
      </nav>

      {/* Header */}
      <div className="mb-6">
        <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-2">
          Tambah Nasabah
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
          Masukkan informasi detail untuk mendaftarkan nasabah penabung sampah baru ke dalam
          sistem.
        </p>
      </div>

      <NasabahForm cancelHref="/admin/nasabah" />
    </>
  );
}