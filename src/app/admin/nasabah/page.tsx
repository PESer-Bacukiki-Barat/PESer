import type { Metadata } from "next";
import { ChevronRight } from "lucide-react";

import { NasabahTable } from "@/components/admin/nasabah-table";
import { NASABAH } from "@/lib/nasabah-data";

export const metadata: Metadata = {
  title: "Manajemen Nasabah",
};

export default function NasabahPage() {
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
        <span className="text-on-surface font-semibold">Manajemen Nasabah</span>
      </nav>

      {/* Header */}
      <div className="mb-6">
        <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-2">
          Manajemen Nasabah
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
          Kelola data nasabah penabung sampah, keterangan bank sampah, dan identitas setoran di
          setiap unit bank sampah.
        </p>
      </div>

      <NasabahTable nasabahs={NASABAH} />
    </>
  );
}