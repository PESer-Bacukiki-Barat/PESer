import type { Metadata } from "next";
import { ChevronRight } from "lucide-react";

import { PembeliTable } from "@/components/admin/pembeli-table";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Manajemen Pembeli",
};

export const dynamic = "force-dynamic";

export default async function PembeliPage() {
  const pembelis = await prisma.pembeli.findMany({
    where: { deletedAt: null },
    orderBy: { nama: "asc" },
    select: {
      id: true,
      nama: true,
      perusahaan: true,
      noHp: true,
      alamat: true,
      catatan: true,
      isActive: true,
    },
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

      <PembeliTable pembelis={pembelis} />
    </>
  );
}