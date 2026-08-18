"use client";

import Link from "next/link";
import { Download, Eye, Pencil, Plus, Trash2 } from "lucide-react";

import {
  DataTable,
  type Column,
} from "@/components/ui/data-table";

export type KelurahanStatus = "Aktif" | "Non-aktif";

export type Kelurahan = {
  id: string;
  name: string;
  kecamatan: string;
  bankSampah: number;
  status: KelurahanStatus;
};

const STATUS_STYLES: Record<KelurahanStatus, string> = {
  Aktif: "bg-primary-container text-on-primary-container border border-primary/20",
  "Non-aktif": "bg-surface-dim text-on-surface-variant border border-outline-variant",
};

const columns: Column<Kelurahan>[] = [
  { id: "id", header: "Kode Kelurahan", cell: (k) => k.id },
  {
    id: "name",
    header: "Nama Kelurahan",
    cell: (k) => <p className="font-medium text-on-surface">{k.name}</p>,
  },
  {
    id: "kecamatan",
    header: "Kecamatan",
    cell: (k) => <p className="text-on-surface-variant">{k.kecamatan}</p>,
  },
  {
    id: "bankSampah",
    header: "Jml. Bank Sampah",
    align: "center",
    cell: (k) => <p className="text-center font-label-sm text-label-sm text-on-surface">{k.bankSampah}</p>,
  },
  {
    id: "status",
    header: "Status",
    align: "center",
    cell: (k) => (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[k.status]}`}
      >
        {k.status}
      </span>
    ),
  },
];

export function KelurahanTable({
  kelurahans,
  onEdit,
  onDelete,
  onView,
  onExport,
  onSelectedChange,
}: {
  kelurahans: Kelurahan[];
  onEdit?: (kel: Kelurahan) => void;
  onDelete?: (kel: Kelurahan) => void;
  onView?: (kel: Kelurahan) => void;
  onExport?: () => void;
  onSelectedChange?: (ids: string[]) => void;
}) {
  return (
    <DataTable
      data={kelurahans}
      columns={columns}
      getRowId={(k) => k.id}
      searchKeys={["id", "name"]}
      filters={[
        {
          id: "status",
          placeholder: "Semua Status",
          options: [
            { value: "Aktif", label: "Aktif" },
            { value: "Non-aktif", label: "Non-aktif" },
          ],
          matches: (k, value) => k.status === value,
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
            href="/admin/kelurahan/tambah"
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-primary text-on-primary text-white hover:bg-primary-fixed-variant transition-colors shadow-sm font-label-md text-label-md font-semibold"
          >
            <Plus className="size-[18px]" />
            <span className="hidden sm:inline">Tambah Kelurahan</span>
          </Link>
        </>
      }
      actions={() => [
        {
          label: "Lihat Detail",
          icon: Eye,
          className: "hover:text-primary",
          onClick: (k) => onView?.(k),
        },
        {
          label: "Edit",
          icon: Pencil,
          className: "hover:text-primary",
          onClick: (k) => onEdit?.(k),
        },
        {
          label: "Hapus",
          icon: Trash2,
          className: "hover:text-error hover:bg-error-container",
          onClick: (k) => onDelete?.(k),
        },
      ]}
      emptyState={
        <p className="text-center text-on-surface-variant">
          Tidak ada kelurahan ditemukan.
        </p>
      }
    />
  );
}
