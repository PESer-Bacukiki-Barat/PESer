"use client";

import Link from "next/link";
import { Download, Eye, Pencil, Plus, Trash2 } from "lucide-react";

import { DataTable, type Column } from "@/components/ui/data-table";

export type JenisSampahStatus = "Aktif" | "Non-aktif";

export type JenisSampah = {
  kode: string;
  nama: string;
  kategori: string;
  berat: number;
  deskripsi: string;
  status: JenisSampahStatus;
};

const STATUS_STYLES: Record<JenisSampahStatus, string> = {
  Aktif: "bg-secondary-container text-on-secondary-container border border-secondary/20",
  "Non-aktif": "bg-surface-variant text-on-surface-variant border border-outline-variant",
};

export const KATEGORI = [
  { value: "Plastik", label: "Plastik" },
  { value: "Kertas", label: "Kertas" },
  { value: "Kaca", label: "Kaca" },
  { value: "Logam", label: "Logam" },
];

const columns: Column<JenisSampah>[] = [
  {
    id: "kode",
    header: "Kode Sampah",
    cell: (j) => <p className="font-label-sm text-label-sm font-medium text-primary">{j.kode}</p>,
  },
  {
    id: "nama",
    header: "Nama Sampah",
    cell: (j) => <p className="font-medium text-on-surface">{j.nama}</p>,
  },
  {
    id: "kategori",
    header: "Kategori",
    cell: (j) => <p className="text-on-surface-variant">{j.kategori}</p>,
  },
  {
    id: "berat",
    header: "Berat (kg)",
    align: "right",
    cell: (j) => <p className="font-label-sm text-label-sm text-right text-on-surface">{j.berat.toFixed(1)}</p>,
  },
  {
    id: "deskripsi",
    header: "Deskripsi",
    className: "hidden lg:table-cell",
    cell: (j) => (
      <p className="text-on-surface-variant text-sm truncate max-w-xs">{j.deskripsi}</p>
    ),
  },
  {
    id: "status",
    header: "Status",
    align: "center",
    cell: (j) => (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-label-sm text-label-sm font-medium ${STATUS_STYLES[j.status]}`}
      >
        {j.status}
      </span>
    ),
  },
];

export function JenisSampahTable({
  jenisSampahs,
  onEdit,
  onDelete,
  onView,
  onExport,
  onSelectedChange,
}: {
  jenisSampahs: JenisSampah[];
  onEdit?: (j: JenisSampah) => void;
  onDelete?: (j: JenisSampah) => void;
  onView?: (j: JenisSampah) => void;
  onExport?: () => void;
  onSelectedChange?: (ids: string[]) => void;
}) {
  return (
    <DataTable
      data={jenisSampahs}
      columns={columns}
      getRowId={(j) => j.kode}
      searchKeys={["kode", "nama"]}
      searchPlaceholder="Cari Kode atau Nama Sampah..."
      filters={[
        {
          id: "kategori",
          placeholder: "Semua Kategori",
          options: KATEGORI,
          matches: (j, value) => j.kategori === value,
        },
        {
          id: "status",
          placeholder: "Semua Status",
          options: [
            { value: "Aktif", label: "Aktif" },
            { value: "Non-aktif", label: "Non-aktif" },
          ],
          matches: (j, value) => j.status === value,
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
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 h-10 px-4 rounded-lg border border-outline-variant bg-surface text-on-surface hover:bg-surface-container-high transition-colors font-label-md text-label-md font-medium"
          >
            <Download className="size-[18px]" />
            <span className="hidden sm:inline">Export Data</span>
          </button>
          <Link
            href="/admin/jenis-sampah/tambah"
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-primary text-on-primary hover:bg-primary-fixed-variant transition-colors shadow-sm font-label-md text-label-md font-semibold"
          >
            <Plus className="size-[18px]" />
            <span className="hidden sm:inline">Tambah Jenis Sampah</span>
          </Link>
        </>
      }
      actions={() => [
        {
          label: "Lihat Detail",
          icon: Eye,
          className: "hover:text-primary",
          onClick: (j) => onView?.(j),
        },
        {
          label: "Edit",
          icon: Pencil,
          className: "hover:text-primary",
          onClick: (j) => onEdit?.(j),
        },
        {
          label: "Hapus",
          icon: Trash2,
          className: "hover:text-error hover:bg-error-container",
          onClick: (j) => onDelete?.(j),
        },
      ]}
      emptyState={
        <p className="text-center text-on-surface-variant">
          Tidak ada jenis sampah ditemukan.
        </p>
      }
    />
  );
}
