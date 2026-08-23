import type { Metadata } from "next";
import { ChevronRight } from "lucide-react";

import { BankSampahTable } from "@/components/admin/bank-sampah-table";
import {
  BankSampahStockSummary,
  type StockItem,
} from "@/components/admin/bank-sampah-stock-summary";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Manajemen Bank Sampah",
};

export const dynamic = "force-dynamic";

export default async function BankSampahPage() {
  const [bankSampah, kelurahans, stockRows] = await Promise.all([
    prisma.bankSampah.findMany({
      where: { deletedAt: null },
      orderBy: { nama: "asc" },
      select: {
        id: true,
        nama: true,
        kelurahanId: true,
        kelurahan: { select: { nama: true } },
        alamat: true,
        latitude: true,
        longitude: true,
        isActive: true,
      },
    }),
    prisma.kelurahan.findMany({
      where: { deletedAt: null },
      orderBy: { nama: "asc" },
      select: { id: true, nama: true },
    }),
    prisma.stock.findMany({
      select: {
        bankSampahId: true,
        jenisSampahId: true,
        berat: true,
        beratReservasi: true,
        jenisSampah: { select: { nama: true } },
      },
    }),
  ]);

  const kelurahanOptions = kelurahans.map((k) => ({ value: k.id, label: k.nama }));

  // Kelompokkan stock per bank sampah untuk ringkasan (Decimal -> number).
  const stockPerBank = new Map<string, StockItem[]>();
  for (const row of stockRows) {
    const list = stockPerBank.get(row.bankSampahId) ?? [];
    list.push({
      jenisSampahId: row.jenisSampahId,
      jenisSampah: row.jenisSampah.nama,
      berat: Number(row.berat),
      beratReservasi: Number(row.beratReservasi),
    });
    stockPerBank.set(row.bankSampahId, list);
  }

  const stockSummaryData = bankSampah.map((b) => ({
    id: b.id,
    isActive: b.isActive,
    stock: stockPerBank.get(b.id) ?? [],
  }));

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

      <BankSampahTable
        bankSampah={bankSampah.map((b) => ({
          id: b.id,
          nama: b.nama,
          kelurahanId: b.kelurahanId,
          kelurahanNama: b.kelurahan?.nama ?? null,
          alamat: b.alamat,
          latitude: b.latitude.toNumber(),
          longitude: b.longitude.toNumber(),
          isActive: b.isActive,
        }))}
        kelurahanOptions={kelurahanOptions}
      />

      <BankSampahStockSummary bankSampah={stockSummaryData} />
    </>
  );
}
