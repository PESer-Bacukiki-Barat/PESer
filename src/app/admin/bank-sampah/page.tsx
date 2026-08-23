import type { Metadata } from "next";
import { ChevronRight } from "lucide-react";

import { BankSampahTable } from "@/components/admin/bank-sampah-table";
import { BankSampahStockSummary } from "@/components/admin/bank-sampah-stock-summary";
import { BANK_SAMPAH } from "@/lib/bank-sampah-data";

export const metadata: Metadata = {
  title: "Manajemen Bank Sampah",
};

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
      <BankSampahStockSummary bankSampah={BANK_SAMPAH} />
    </>
  );
}