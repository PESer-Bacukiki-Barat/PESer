import Link from "next/link"
import type { Metadata } from "next";
import { ChevronRight } from "lucide-react";

import { redirect } from "next/navigation";

import { NasabahTable } from "@/components/admin/nasabah-table";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/auth";
import { filterLingkup } from "@/app/api/nasabah/lingkup";

export const metadata: Metadata = {
  title: "Manajemen Nasabah",
};

export const dynamic = "force-dynamic";

export default async function NasabahPage() {
  // Middleware mengizinkan PETUGAS membuka halaman ini (FR-B7), jadi
  // lingkupnya harus dibatasi di sini juga — bukan hanya di API-nya. Tanpa itu
  // tabel yang dirender server tetap membocorkan nama, nomor HP, dan alamat
  // warga pos lain meski endpointnya sudah aman.
  const user = await getServerUser();
  if (!user) redirect("/login");
  const lingkup = filterLingkup(user);

  const [nasabahs, bankSampahs] = await Promise.all([
    prisma.nasabah.findMany({
      where: { deletedAt: null, ...lingkup },
      orderBy: { nama: "asc" },
      select: {
        id: true,
        kodeNasabah: true,
        bankSampahId: true,
        nama: true,
        noHp: true,
        alamat: true,
        rt: true,
        rw: true,
        isActive: true,
      },
    }),
    prisma.bankSampah.findMany({
      where: {
        deletedAt: null,
        ...(lingkup.bankSampahId ? { id: lingkup.bankSampahId } : {}),
      },
      orderBy: { nama: "asc" },
      select: { id: true, nama: true },
    }),
  ]);

  const bankSampahOptions = bankSampahs.map((b) => ({ value: b.id, label: b.nama }));

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

      <NasabahTable nasabahs={nasabahs} bankSampahOptions={bankSampahOptions} />
    </>
  );
}