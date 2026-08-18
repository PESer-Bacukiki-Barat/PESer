import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { PetugasForm } from "@/components/admin/petugas-form";

export const metadata: Metadata = {
  title: "Tambah Petugas",
};

export default function TambahPetugasPage() {
  return (
    <>
      {/* Breadcrumbs */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-2 text-on-surface-variant font-label-sm text-label-sm mb-6"
      >
        <Link className="hover:text-primary transition-colors" href="/admin">
          Dashboard
        </Link>
        <ChevronRight className="size-4" />
        <Link className="hover:text-primary transition-colors" href="/admin/petugas">
          Manajemen Petugas
        </Link>
        <ChevronRight className="size-4" />
        <span className="text-on-surface font-semibold">Tambah Petugas</span>
      </nav>

      {/* Header */}
      <div className="mb-6">
        <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-2">
          Tambah Petugas
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
          Masukkan informasi detail untuk mendaftarkan petugas operasional baru ke dalam sistem.
        </p>
      </div>

      <PetugasForm cancelHref="/admin/petugas" />
    </>
  );
}