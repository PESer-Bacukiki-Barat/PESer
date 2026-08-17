"use client";

import { Download, Eye, Pencil, Plus, Trash2 } from "lucide-react";

import { DataTable, type Column } from "@/components/ui/data-table";

export type PembeliStatus = "Aktif" | "Non-aktif";

export type Pembeli = {
  id: string;
  nama: string;
  perusahaan: string;
  noHp: string;
  alamat: string;
  catatan: string;
  status: PembeliStatus;
};

const STATUS_STYLES: Record<PembeliStatus, string> = {
  Aktif: "bg-primary-container text-on-primary-container border border-primary/20",
  "Non-aktif": "bg-surface-dim text-on-surface-variant border border-outline-variant",
};

export const PERUSAHAAN = [
  { value: "PT Daur Ulang Sejahtera", label: "PT Daur Ulang Sejahtera" },
  { value: "CV Kertas Jaya", label: "CV Kertas Jaya" },
];

const columns: Column<Pembeli>[] = [
  {
    id: "nama",
    header: "Nama",
    cell: (p) => <p className="font-medium text-on-surface">{p.nama}</p>,
  },
  {
    id: "perusahaan",
    header: "Perusahaan",
    cell: (p) => <p className="text-on-surface">{p.perusahaan}</p>,
  },
  {
    id: "noHp",
    header: "No. HP",
    cell: (p) => <p className="font-label-md text-label-md text-on-surface">{p.noHp}</p>,
  },
  {
    id: "alamat",
    header: "Alamat",
    className: "hidden lg:table-cell",
    cell: (p) => (
      <p className="text-on-surface-variant truncate max-w-[150px]">{p.alamat}</p>
    ),
  },
  {
    id: "catatan",
    header: "Catatan",
    className: "hidden xl:table-cell",
    cell: (p) => (
      <p className="text-on-surface-variant truncate max-w-[150px]" title={p.catatan}>
        {p.catatan}
      </p>
    ),
  },
  {
    id: "status",
    header: "Status",
    align: "center",
    cell: (p) => (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[p.status]}`}
      >
        {p.status}
      </span>
    ),
  },
];

export function PembeliTable({
  pembelis,
  onAdd,
  onEdit,
  onDelete,
  onView,
  onExport,
  onSelectedChange,
}: {
  pembelis: Pembeli[];
  onAdd?: () => void;
  onEdit?: (p: Pembeli) => void;
  onDelete?: (p: Pembeli) => void;
  onView?: (p: Pembeli) => void;
  onExport?: () => void;
  onSelectedChange?: (ids: string[]) => void;
}) {
  return (
    <DataTable
      data={pembelis}
      columns={columns}
      getRowId={(p) => p.id}
      searchKeys={["nama", "perusahaan"]}
      searchPlaceholder="Cari Nama atau Perusahaan..."
      filters={[
        {
          id: "status",
          placeholder: "Semua Status",
          options: [
            { value: "Aktif", label: "Aktif" },
            { value: "Non-aktif", label: "Non-aktif" },
          ],
          matches: (p, value) => p.status === value,
        },
        {
          id: "perusahaan",
          placeholder: "Semua Perusahaan",
          options: PERUSAHAAN,
          matches: (p, value) => p.perusahaan === value,
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
          <button
            type="button"
            onClick={onAdd}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-primary text-on-primary hover:bg-primary-fixed-variant transition-colors shadow-sm font-label-md text-label-md font-semibold"
          >
            <Plus className="size-[18px]" />
            <span className="hidden sm:inline">Tambah Pembeli</span>
          </button>
        </>
      }
      actions={() => [
        {
          label: "Lihat Detail",
          icon: Eye,
          className: "hover:text-primary",
          onClick: (p) => onView?.(p),
        },
        {
          label: "Edit",
          icon: Pencil,
          className: "hover:text-primary",
          onClick: (p) => onEdit?.(p),
        },
        {
          label: "Hapus",
          icon: Trash2,
          className: "hover:text-error hover:bg-error-container",
          onClick: (p) => onDelete?.(p),
        },
      ]}
      emptyState={
        <p className="text-center text-on-surface-variant">
          Tidak ada pembeli ditemukan.
        </p>
      }
    />
  );
}
