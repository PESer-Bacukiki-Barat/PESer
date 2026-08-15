import type { Metadata } from "next";
import { ChevronRight } from "lucide-react";

import { PetugasTable, type Petugas } from "@/components/admin/petugas-table";

export const metadata: Metadata = {
  title: "Manajemen Petugas",
};

const PETUGAS: Petugas[] = [
  {
    initials: "BS",
    initialsClass: "bg-surface-container-high text-on-surface",
    nama: "Budi Santoso",
    nip: "ID-00124",
    unitKerja: "Kelurahan Menteng",
    noHp: "+62 812-3456-7890",
    status: "Active",
  },
  {
    initials: "SR",
    initialsClass: "bg-surface-container-high text-on-surface",
    nama: "Siti Rahma",
    nip: "ID-00125",
    unitKerja: "Kelurahan Senayan",
    noHp: "+62 856-7890-1234",
    status: "Disabled",
  },
  {
    initials: "AW",
    initialsClass: "bg-secondary-container text-on-secondary-container",
    nama: "Ahmad Wijaya",
    nip: "ID-00126",
    unitKerja: "Kelurahan Cikini",
    noHp: "+62 813-5555-9999",
    status: "Pending",
  },
];

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
      <div className="flex flex-col md:flex-row justify-between mb-6">
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