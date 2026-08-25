"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Download, Eye, Pencil, Plus } from "lucide-react";

import { DataTable, type Column } from "@/components/ui/data-table";
import { EditDispatchModal } from "@/components/admin/dispatch-edit-modal";
import type {
  Dispatch,
  DispatchStatus,
  DispatchFormOptions,
} from "@/lib/dispatch-data";
import { BOLEH_REVISI } from "@/lib/dispatch-aksi";
import {
  DISPATCH_STATUS_LABEL,
} from "@/lib/dispatch-data";

export type { Dispatch, DispatchStatus } from "@/lib/dispatch-data";

const STATUS_STYLES: Record<DispatchStatus, string> = {
  DRAFT: "bg-surface-dim text-on-surface-variant border border-outline-variant",
  DISPATCHED:
    "bg-surface-container-highest text-on-surface-variant border border-outline-variant",
  DITERIMA:
    "bg-secondary-container text-on-secondary-container border border-secondary-fixed",
  DITOLAK: "bg-error-container text-on-error-container border border-error",
  SERAH_TERIMA:
    "bg-tertiary-container text-on-tertiary-container border border-tertiary",
  SELESAI:
    "bg-secondary-container text-on-secondary-container border border-secondary-fixed",
  DIBATALKAN:
    "bg-surface-variant text-on-surface-variant border border-outline-variant",
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatCurrency(value: number | null | undefined): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
}

export function DispatchTable({
  dispatches,
  options,
  onEdit,
  onView,
  onExport,
  onSelectedChange,
}: {
  dispatches: Dispatch[];
  options: DispatchFormOptions;
  onEdit?: (d: Dispatch) => void;
  onView?: (d: Dispatch) => void;
  onExport?: () => void;
  onSelectedChange?: (ids: string[]) => void;
}) {
  const [editing, setEditing] = useState<Dispatch | null>(null);

  const indexById = useMemo(() => {
    const map = new Map<string, number>();
    dispatches.forEach((d, i) => map.set(d.id, i + 1));
    return map;
  }, [dispatches]);

  const columns: Column<Dispatch>[] = useMemo(
    () => [
      {
        id: "no",
        header: "No",
        align: "center",
        cell: (d) => (
          <p className="font-label-md text-label-md font-mono text-on-surface-variant text-center">
            {indexById.get(d.id)}
          </p>
        ),
      },
      {
        id: "kodeDispatch",
        header: "Kode Dispatch",
        cell: (d) => (
          <p className="font-label-md text-label-md font-mono font-semibold text-primary">
            {d.kodeDispatch}
          </p>
        ),
      },
      {
        id: "bankSampah",
        header: "Bank Sampah",
        cell: (d) => <p className="text-on-surface">{d.bankSampah}</p>,
      },
      {
        id: "pembeli",
        header: "Pembeli",
        cell: (d) => <p className="text-on-surface">{d.pembeli}</p>,
      },
      {
        id: "status",
        header: "Status",
        align: "center",
        cell: (d) => (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-label-sm text-label-sm ${STATUS_STYLES[d.status]}`}
          >
            {DISPATCH_STATUS_LABEL[d.status]}
          </span>
        ),
      },
      {
        id: "tanggalJemput",
        header: "Tgl Jemput",
        cell: (d) => (
          <p className="font-label-sm text-label-sm text-on-surface-variant">
            {formatDate(d.tanggalJemput)}
          </p>
        ),
      },
      {
        id: "totalNilai",
        header: "Total Nilai",
        align: "right",
        cell: (d) => (
          <p className="font-label-md text-label-md font-mono text-on-surface">
            {formatCurrency(d.totalNilai)}
          </p>
        ),
      },
    ],
    [indexById],
  );

  return (
    <>
      <DataTable
        data={dispatches}
        columns={columns}
        getRowId={(d) => d.id}
        searchKeys={["kodeDispatch", "bankSampah", "pembeli"]}
        searchPlaceholder="Cari Kode Dispatch, Bank Sampah, atau Pembeli..."
        filters={[
          {
            id: "status",
            placeholder: "Semua Status",
            options: [
              { value: "DRAFT", label: "Draft" },
              { value: "DISPATCHED", label: "Diproses" },
              { value: "DITERIMA", label: "Diterima" },
              { value: "DITOLAK", label: "Ditolak" },
              { value: "SERAH_TERIMA", label: "Serah Terima" },
              { value: "SELESAI", label: "Selesai" },
              { value: "DIBATALKAN", label: "Dibatalkan" },
            ],
            matches: (d, value) => d.status === value,
          },
        ]}
        selectable
        pageSize={10}
        onSelectedChange={onSelectedChange}
        toolbarActions={
          <>
            <button
              type="button"
              onClick={onExport}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 h-10 px-4 rounded-lg border border-outline-variant bg-surface text-on-surface hover:bg-surface-container-low transition-colors font-label-md text-label-md font-medium"
            >
              <Download className="size-[18px]" />
              <span className="hidden sm:inline">Export Data</span>
            </button>
            <Link
              href="/admin/transaksi/tambah"
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-primary text-on-primary hover:bg-primary/90 transition-colors shadow-sm font-label-md text-label-md font-semibold"
            >
              <Plus className="size-[18px]" />
              <span className="hidden sm:inline">Tambah Dispatch</span>
            </Link>
          </>
        }
        actions={(row) => [
          {
            label: "Lihat Detail",
            icon: Eye,
            className: "hover:text-primary",
            onClick: (d) => onView?.(d),
          },
          // Isi dispatch hanya bisa disunting selama DRAFT/DITOLAK — sama
          // dengan yang ditegakkan PUT /api/dispatch/:id. Di luar itu tombolnya
          // tidak ditampilkan supaya UI tidak menawarkan aksi yang akan ditolak.
          ...(BOLEH_REVISI.includes(row.status)
            ? [
                {
                  label: "Edit",
                  icon: Pencil,
                  className: "hover:text-primary",
                  onClick: (d: Dispatch) => {
                    onEdit?.(d);
                    setEditing(d);
                  },
                },
              ]
            : []),
          // Tidak ada aksi "Hapus": PRD §2.5 aturan 1 melarang DELETE untuk
          // Dispatch. Pembatalan yang sah lewat transisi DIBATALKAN di halaman
          // detail, yang juga melepas reservasi stock.
        ]}
        emptyState={
          <p className="text-center text-on-surface-variant">
            Tidak ada transaksi dispatch ditemukan.
          </p>
        }
      />

      {editing && (
        <EditDispatchModal
          dispatch={editing}
          options={options}
          open
          onOpenChange={(open) => {
            if (!open) setEditing(null);
          }}
        />
      )}
    </>
  );
}
