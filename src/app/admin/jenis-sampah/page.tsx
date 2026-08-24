import Link from "next/link"
import type { Metadata } from "next";
import { ChevronRight } from "lucide-react";

import { JenisSampahTable } from "@/components/admin/jenis-sampah-table";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Manajemen Jenis Sampah",
};

export const dynamic = "force-dynamic";

export default async function JenisSampahPage() {
  const data = await prisma.jenisSampah.findMany({
    where: { deletedAt: null },
    orderBy: { kode: "asc" },
  });

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

      <JenisSampahTable
        jenisSampahs={data.map((j) => ({
          id: j.id,
          kode: j.kode,
          nama: j.nama,
          kategori: j.kategori,
          satuan: j.satuan,
          harga: j.harga.toNumber(),
          deskripsi: j.deskripsi,
          isActive: j.isActive,
        }))}
      />
    </>
  );
}
