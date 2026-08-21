import type { Metadata } from "next";
import { ChevronRight } from "lucide-react";

import { BankSampahForm } from "@/components/admin/bank-sampah-form";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Tambah Bank Sampah",
};

export const dynamic = "force-dynamic";

export default async function TambahBankSampahPage() {
  const kelurahans = await prisma.kelurahan.findMany({
    where: { deletedAt: null },
    orderBy: { nama: "asc" },
    select: { id: true, nama: true },
  });
  const kelurahanOptions = kelurahans.map((k) => ({ value: k.id, label: k.nama }));

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
        <a className="hover:text-primary transition-colors" href="/admin/bank-sampah">
          Manajemen Bank Sampah
        </a>
        <ChevronRight className="size-4" />
        <span className="text-on-surface font-semibold">Tambah Bank Sampah</span>
      </nav>

      {/* Header */}
      <div className="mb-6">
        <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-2">
          Tambah Bank Sampah
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
          Masukkan informasi detail untuk mendaftarkan unit bank sampah baru ke dalam sistem.
        </p>
      </div>

      <BankSampahForm cancelHref="/admin/bank-sampah" kelurahanOptions={kelurahanOptions} />
    </>
  );
}