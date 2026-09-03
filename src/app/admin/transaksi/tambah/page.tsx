import Link from "next/link"
import type { Metadata } from "next";
import { ChevronRight } from "lucide-react";

import { TambahDispatchForm } from "@/app/admin/transaksi/tambah/tambah-dispatch-form";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Tambah Dispatch",
};

export const dynamic = "force-dynamic";

export default async function TambahDispatchPage() {
  const [bankSampahRows, pembeliRows, jenisSampahRows] = await Promise.all([
    prisma.bankSampah.findMany({
      where: { deletedAt: null, isActive: true },
      orderBy: { nama: "asc" },
      select: { id: true, nama: true },
    }),
    prisma.pembeli.findMany({
      where: { deletedAt: null, isActive: true },
      orderBy: { nama: "asc" },
      select: { id: true, nama: true },
    }),
    prisma.jenisSampah.findMany({
      where: { deletedAt: null, isActive: true },
      orderBy: { nama: "asc" },
      select: { id: true, nama: true },
    }),
  ]);

  const options = {
    bankSampah: bankSampahRows.map((b) => ({ value: b.id, label: b.nama })),
    pembeli: pembeliRows.map((p) => ({ value: p.id, label: p.nama })),
    jenisSampah: jenisSampahRows.map((j) => ({ value: j.id, label: j.nama })),
  };

  return (
    <>
      {/* Breadcrumbs */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-2 text-on-surface-variant font-label-sm text-label-sm mb-6"
      >
        <Link className="tekan-halus hover:text-primary" href="/admin">
          Dashboard
        </Link>
        <ChevronRight className="size-4" aria-hidden />
        <Link className="tekan-halus hover:text-primary" href="/admin/transaksi">
          Manajemen Transaksi
        </Link>
        <ChevronRight className="size-4" aria-hidden />
        <span className="text-on-surface font-semibold">Tambah Dispatch</span>
      </nav>

      {/* Header */}
      <div className="mb-6">
        <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-2">
          Tambah Dispatch
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
          Buat dispatch baru untuk pengiriman sampah ke pembeli (pengepul).
        </p>
      </div>

      <TambahDispatchForm options={options} />
    </>
  );
}
