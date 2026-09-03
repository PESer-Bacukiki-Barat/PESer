"use client";

import { useMemo } from "react";
import { Download } from "lucide-react";

import { DataTable, type Column } from "@/components/ui/data-table";
import { viewAction } from "@/components/admin/row-actions";
import type { Setoran } from "@/lib/setoran-data";
import {
  KONDISI_SAMPAH_LABEL,
  kondisiStyle,
} from "@/lib/setoran-data";

export type { Setoran, SetoranItem } from "@/lib/setoran-data";
import { fmtAngka, fmtBerat, fmtRupiah, fmtTanggal } from "@/lib/format";

export function SetoranTable({
  setorans,
  onView,
  onExport,
  onSelectedChange,
}: {
  setorans: Setoran[];
  onView?: (s: Setoran) => void;
  onExport?: () => void;
  onSelectedChange?: (ids: string[]) => void;
}) {
  const indexById = useMemo(() => {
    const map = new Map<string, number>();
    setorans.forEach((s, i) => map.set(s.id, i + 1));
    return map;
  }, [setorans]);

  const columns: Column<Setoran>[] = useMemo(
    () => [
      {
        id: "no",
        header: "No",
        align: "center",
        cell: (s) => (
          <p className="font-label-md text-label-md font-mono text-on-surface-variant text-center">
            {indexById.get(s.id)}
          </p>
        ),
      },
      {
        id: "kodeTransaksi",
        header: "Kode Transaksi",
        cell: (s) => (
          <p className="font-label-md text-label-md font-mono font-semibold text-primary">
            {s.kodeTransaksi}
          </p>
        ),
      },
      {
        id: "bankSampah",
        header: "Bank Sampah",
        cell: (s) => <p className="font-medium text-on-surface">{s.bankSampah}</p>,
      },
      {
        id: "nasabah",
        header: "Nasabah",
        cell: (s) => <p className="font-medium text-on-surface">{s.nasabah}</p>,
      },
      {
        id: "petugas",
        header: "Petugas",
        cell: (s) => (
          <p className="font-label-md text-label-md text-on-surface-variant">
            {s.petugas || "—"}
          </p>
        ),
      },
      {
        id: "jumlahItem",
        header: "Item",
        align: "center",
        cell: (s) => (
          <p className="font-label-md text-label-md text-center text-on-surface">
            {fmtAngka(s.items.length)}
          </p>
        ),
      },
      {
        id: "jenisRingkasan",
        header: "Jenis Sampah",
        className: "hidden md:table-cell",
        cell: (s) => {
          const jenisUnik = Array.from(new Set(s.items.map((i) => i.jenisSampah)));
          return (
            <div className="flex flex-col gap-0.5">
              {jenisUnik.slice(0, 2).map((j, idx) => (
                <p
                  key={idx}
                  className="font-label-sm text-label-sm text-on-surface-variant truncate max-w-[130px]"
                  title={j}
                >
                  {j}
                </p>
              ))}
              {jenisUnik.length > 2 && (
                <p className="font-label-sm text-label-sm text-on-surface-variant">
                  +{jenisUnik.length - 2} lainnya
                </p>
              )}
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full font-label-sm text-label-sm ${
                  jenisUnik.length > 1
                    ? "bg-surface-variant text-on-surface-variant border border-outline-variant"
                    : kondisiStyle(s.items[0].kondisi)
                }`}
              >
                {jenisUnik.length > 1
                  ? `${jenisUnik.length} jenis`
                  : KONDISI_SAMPAH_LABEL[s.items[0].kondisi]}
              </span>
            </div>
          );
        },
      },
      {
        id: "totalBerat",
        header: "Total Berat (kg)",
        align: "right",
        cell: (s) => (
          <p className="font-label-md text-label-md font-mono text-on-surface">
            {fmtBerat(s.totalBerat)}
          </p>
        ),
      },
      {
        id: "totalNilai",
        header: "Total Nilai",
        align: "right",
        cell: (s) => (
          <p className="font-label-md text-label-md font-mono text-primary">
            {fmtRupiah(s.totalNilai)}
          </p>
        ),
      },
      {
        id: "cashDibayar",
        header: "Pembayaran",
        align: "center",
        cell: (s) =>
          s.cashDibayar ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full font-label-sm text-label-sm bg-secondary-container text-on-secondary-container border border-secondary/20">
              Lunas
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full font-label-sm text-label-sm bg-error-container text-on-error-container border border-error">
              Belum
            </span>
          ),
      },
      {
        id: "tanggal",
        header: "Tanggal",
        cell: (s) => (
          <p className="font-label-sm text-label-sm text-on-surface-variant">
            {fmtTanggal(s.tanggal)}
          </p>
        ),
      },
    ],
    [indexById],
  );

  return (
    <DataTable
      data={setorans}
      columns={columns}
      getRowId={(s) => s.id}
      searchKeys={["kodeTransaksi", "bankSampah", "nasabah", "petugas"]}
      searchPlaceholder="Cari Kode Transaksi, Bank Sampah, Nasabah, atau Petugas..."
      selectable
      pageSize={10}
      onSelectedChange={onSelectedChange}
      toolbarActions={
        <button
          type="button"
          onClick={onExport}
          className="sentuh-nyaman tekan-halus flex-1 sm:flex-none flex items-center justify-center gap-2 h-10 px-4 rounded-lg border border-outline-variant bg-surface text-on-surface hover:bg-surface-container-low font-label-md text-label-md font-medium focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/50"
        >
          <Download className="size-4" aria-hidden />
          <span className="hidden sm:inline">Export Data</span>
        </button>
      }
      actions={() => [viewAction<Setoran>((row) => onView?.(row))]}
      emptyState={
        <p className="text-center text-on-surface-variant">
          Tidak ada transaksi setoran ditemukan.
        </p>
      }
    />
  );
}
