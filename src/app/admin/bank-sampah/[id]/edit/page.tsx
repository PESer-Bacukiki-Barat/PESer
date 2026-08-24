import Link from "next/link"
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";

import { BankSampahForm } from "@/components/admin/bank-sampah-form";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Edit Bank Sampah",
};

export const dynamic = "force-dynamic";

export default async function EditBankSampahPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [bankSampah, kelurahans] = await Promise.all([
    prisma.bankSampah.findFirst({ where: { id, deletedAt: null } }),
    prisma.kelurahan.findMany({
      where: { deletedAt: null },
      orderBy: { nama: "asc" },
      select: { id: true, nama: true },
    }),
  ]);

  if (!bankSampah) notFound();

  const kelurahanOptions = kelurahans.map((k) => ({ value: k.id, label: k.nama }));

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
        <Link className="hover:text-primary transition-colors" href="/admin/bank-sampah">
          Manajemen Bank Sampah
        </Link>
        <ChevronRight className="size-4" />
        <span className="text-on-surface font-semibold">Edit {bankSampah.nama}</span>
      </nav>

      {/* Header */}
      <div className="mb-6">
        <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-2">
          Edit Bank Sampah
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
          Perbarui informasi unit bank sampah {bankSampah.nama}.
        </p>
      </div>

      <BankSampahForm
        mode="edit"
        id={bankSampah.id}
        cancelHref="/admin/bank-sampah"
        kelurahanOptions={kelurahanOptions}
        initialData={{
          nama: bankSampah.nama,
          kelurahanId: bankSampah.kelurahanId,
          alamat: bankSampah.alamat,
          latitude: bankSampah.latitude.toNumber(),
          longitude: bankSampah.longitude.toNumber(),
          isActive: bankSampah.isActive,
        }}
      />
    </>
  );
}
