import type { Metadata } from "next";
import { ChevronRight } from "lucide-react";

import { KelurahanTable } from "@/components/admin/kelurahan-table";
import { KELURAHAN } from "@/lib/kelurahan-data";

export const metadata: Metadata = {
  title: "Manajemen Kelurahan",
};

export default function KelurahanPage() {
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
        <span className="text-on-surface font-semibold">Manajemen Kelurahan</span>
      </nav>

      {/* Header */}
      <div className="mb-6">
        <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-2">
          Manajemen Kelurahan
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
          Kelola daftar wilayah kelurahan, kode administratif, dan status operasional di wilayah
          Kecamatan.
        </p>
      </div>

      <KelurahanTable kelurahans={KELURAHAN} />
    </>
  );
}
