import type { Metadata } from "next";
import { ChevronRight } from "lucide-react";

import {
  KelurahanTable,
  type Kelurahan,
} from "@/components/admin/kelurahan-table";

export const metadata: Metadata = {
  title: "Manajemen Kelurahan",
};

const KELURAHANS: Kelurahan[] = [
  {
    id: "KBY-001",
    name: "Cipete Utara",
    kecamatan: "Kebayoran Baru",
    bankSampah: 12,
    status: "Aktif",
  },
  {
    id: "KBY-002",
    name: "Gandaria Utara",
    kecamatan: "Kebayoran Baru",
    bankSampah: 8,
    status: "Aktif",
  },
  {
    id: "KBY-003",
    name: "Pulo",
    kecamatan: "Kebayoran Baru",
    bankSampah: 3,
    status: "Non-aktif",
  },
  {
    id: "KBY-004",
    name: "Melawai",
    kecamatan: "Kebayoran Baru",
    bankSampah: 5,
    status: "Aktif",
  },
];

export default function KelurahanPage() {
  return (
    <>
      {/* Breadcrumbs */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-2 text-label-sm font-label-sm text-on-surface-variant mb-3"
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
        <p className="text-on-surface-variant max-w-3xl">
          Kelola daftar wilayah kelurahan, kode administratif, dan status operasional di wilayah
          Kecamatan.
        </p>
      </div>

      <KelurahanTable kelurahans={KELURAHANS} />
    </>
  );
}
