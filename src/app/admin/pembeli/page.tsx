import type { Metadata } from "next";
import { ChevronRight } from "lucide-react";

import { PembeliTable, type Pembeli } from "@/components/admin/pembeli-table";

export const metadata: Metadata = {
  title: "Manajemen Pembeli",
};

const PEMBELI: Pembeli[] = [
  {
    id: "P-001",
    nama: "Andi Wijaya",
    perusahaan: "PT Daur Ulang Sejahtera",
    noHp: "+62 812-1111-2222",
    alamat: "Jl. Industri No. 5",
    catatan: "Pembeli rutin plastik",
    status: "Aktif",
  },
  {
    id: "P-002",
    nama: "Siti Aminah",
    perusahaan: "CV Kertas Jaya",
    noHp: "+62 813-3333-4444",
    alamat: "Pergudangan B-12",
    catatan: "-",
    status: "Non-aktif",
  },
];

export default function PembeliPage() {
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
        <span className="text-on-surface font-semibold">Manajemen Pembeli</span>
      </nav>

      {/* Header */}
      <div className="mb-6">
        <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-2">
          Manajemen Pembeli
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
          Kelola data pembeli sampah, informasi perusahaan, dan status kerjasama.
        </p>
      </div>

      <PembeliTable pembelis={PEMBELI} />
    </>
  );
}
