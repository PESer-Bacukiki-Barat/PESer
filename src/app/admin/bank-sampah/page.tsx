import type { Metadata } from "next";
import { ChevronRight } from "lucide-react";

import { BankSampahTable, type BankSampah } from "@/components/admin/bank-sampah-table";

export const metadata: Metadata = {
  title: "Manajemen Bank Sampah",
};

const BANK_SAMPAH: BankSampah[] = [
  {
    id: "BS-MLY-01",
    nama: "Bank Sampah Melati",
    kelurahan: "Menteng",
    alamat: "Jl. Teuku Umar No. 10",
    latitude: -6.1894,
    longitude: 106.8324,
    status: "Active",
  },
  {
    id: "BS-HJU-02",
    nama: "Bank Sampah Hijau",
    kelurahan: "Senayan",
    alamat: "Jl. Asia Afrika",
    latitude: -6.2235,
    longitude: 106.7992,
    status: "Active",
  },
  {
    id: "BS-BRH-03",
    nama: "Bank Sampah Bersih",
    kelurahan: "Cikini",
    alamat: "Jl. Raden Saleh",
    latitude: -6.1915,
    longitude: 106.8398,
    status: "Non-aktif",
  },
];

export default function BankSampahPage() {
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
        <span className="text-on-surface font-semibold">Manajemen Bank Sampah</span>
      </nav>

      {/* Header */}
      <div className="mb-6">
        <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-2">
          Manajemen Bank Sampah
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
          Kelola daftar unit bank sampah, lokasi geografis, dan status operasional di setiap
          kelurahan.
        </p>
      </div>

      <BankSampahTable bankSampah={BANK_SAMPAH} />
    </>
  );
}