import type { Metadata } from "next";
import { ChevronRight } from "lucide-react";

import TransaksiTabs from "@/app/admin/transaksi/transaksi-tabs";

export const metadata: Metadata = {
  title: "Manajemen Transaksi",
};

export default function TransaksiPage() {
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
        <span className="text-on-surface font-semibold">Manajemen Transaksi</span>
      </nav>

      {/* Header */}
      <div className="mb-6">
        <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-2">
          Manajemen Transaksi
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
          Kelola transaksi masuk (Setoran) dan keluar (Dispatch).
        </p>
      </div>

      <TransaksiTabs />
    </>
  );
}
