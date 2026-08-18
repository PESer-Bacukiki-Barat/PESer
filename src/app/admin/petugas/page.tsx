import type { Metadata } from "next";
import { ChevronRight } from "lucide-react";

import { PetugasTable } from "@/components/admin/petugas-table";
import { PETUGAS } from "@/lib/petugas-data";

export const metadata: Metadata = {
  title: "Manajemen Petugas",
};

export default function PetugasPage() {
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
        <span className="text-on-surface font-semibold">Manajemen Petugas</span>
      </nav>

      {/* Header */}
      <div className="mb-6">
        <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-2">
          Manajemen Petugas
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
          Kelola akun petugas bank sampah kelurahan, hak akses, dan informasi kontak petugas
          lapangan.
        </p>
      </div>

      <PetugasTable petugas={PETUGAS} />
    </>
  );
}