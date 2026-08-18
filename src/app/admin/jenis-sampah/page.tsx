import type { Metadata } from "next";
import { ChevronRight } from "lucide-react";

import { JenisSampahTable } from "@/components/admin/jenis-sampah-table";
import { JENIS_SAMPAH } from "@/lib/jenis-sampah-data";

export const metadata: Metadata = {
  title: "Manajemen Jenis Sampah",
};

export default function JenisSampahPage() {
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
        <span className="text-on-surface font-semibold">Manajemen Jenis Sampah</span>
      </nav>

      {/* Header */}
      <div className="mb-6">
        <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-2">
          Manajemen Jenis Sampah
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
          Kelola daftar jenis sampah, kode kategori, dan informasi berat standar untuk sistem
          PESer.
        </p>
      </div>

      <JenisSampahTable jenisSampahs={JENIS_SAMPAH} />
    </>
  );
}
