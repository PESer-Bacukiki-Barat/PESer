import type { Metadata } from "next";
import { ChevronRight } from "lucide-react";

import { KelurahanTable } from "@/components/admin/kelurahan-table";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Manajemen Kelurahan",
};

export const dynamic = "force-dynamic";

export default async function KelurahanPage() {
  const kelurahans = await prisma.kelurahan.findMany({
    where: { deletedAt: null },
    orderBy: { nama: "asc" },
    select: { id: true, nama: true, kodeWilayah: true, createdAt: true },
  });

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
          Kelola daftar wilayah kelurahan dan kode administratifnya di wilayah Kecamatan.
        </p>
      </div>

      <KelurahanTable
        kelurahans={kelurahans.map((k) => ({
          id: k.id,
          nama: k.nama,
          kodeWilayah: k.kodeWilayah,
          createdAt: k.createdAt?.toISOString(),
        }))}
      />
    </>
  );
}
