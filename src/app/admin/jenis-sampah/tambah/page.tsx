import type { Metadata } from "next";
import { ChevronRight } from "lucide-react";

import { JenisSampahForm } from "@/components/admin/jenis-sampah-form";

export const metadata: Metadata = {
  title: "Tambah Jenis Sampah",
};

export default function TambahJenisSampahPage() {
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
        <a className="hover:text-primary transition-colors" href="/admin/jenis-sampah">
          Manajemen Jenis Sampah
        </a>
        <ChevronRight className="size-4" />
        <span className="text-on-surface font-semibold">Tambah Jenis Sampah</span>
      </nav>

      {/* Header */}
      <div className="mb-6">
        <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-2">
          Tambah Jenis Sampah
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
          Masukkan informasi detail untuk menambahkan jenis sampah baru ke dalam sistem.
        </p>
      </div>

      <JenisSampahForm cancelHref="/admin/jenis-sampah" />
    </>
  );
}