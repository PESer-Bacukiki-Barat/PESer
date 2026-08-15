"use client";

import { Download, Eye, KeyRound, Pencil, Plus, Trash2 } from "lucide-react";

import { DataTable, type Column } from "@/components/ui/data-table";

export type PetugasStatus = "Active" | "Pending" | "Disabled";

export type Petugas = {
  initials: string;
  initialsClass: string;
  nama: string;
  nip: string;
  unitKerja: string;
  noHp: string;
  status: PetugasStatus;
};

const STATUS_STYLES: Record<PetugasStatus, string> = {
  Active: "bg-primary-container text-on-primary-container border border-primary-fixed-dim",
  Pending: "bg-tertiary-container text-on-tertiary-container border border-tertiary-fixed-dim",
  Disabled: "bg-surface-variant text-on-surface-variant border border-outline-variant",
};

export const UNIT_KERJA = [
  { value: "Kelurahan Menteng", label: "Kelurahan Menteng" },
  { value: "Kelurahan Senayan", label: "Kelurahan Senayan" },
  { value: "Kelurahan Cikini", label: "Kelurahan Cikini" },
];

const columns: Column<Petugas>[] = [
  {
    id: "profil",
    header: "Profil",
    cell: (p) => (
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center font-label-md text-label-md border border-outline-variant ${p.initialsClass}`}
      >
        {p.initials}
      </div>
    ),
  },
  {
    id: "nama",
    header: "Nama Petugas",
    cell: (p) => <p className="font-medium text-on-surface">{p.nama}</p>,
  },
  {
    id: "nip",
    header: "NIP/ID",
    cell: (p) => <p className="font-label-md text-label-md text-on-surface-variant">{p.nip}</p>,
  },
  {
    id: "unitKerja",
    header: "Unit Kerja",
    cell: (p) => <p className="text-on-surface">{p.unitKerja}</p>,
  },
  {
    id: "noHp",
    header: "Nomor HP",
    cell: (p) => <p className="font-label-md text-label-md text-on-surface">{p.noHp}</p>,
  },
  {
    id: "status",
    header: "Status",
    cell: (p) => (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-label-sm text-label-sm ${STATUS_STYLES[p.status]}`}
      >
        {p.status}
      </span>
    ),
  },
];

export function PetugasTable({
  petugas,
  onAdd,
  onEdit,
  onDelete,
  onView,
  onResetPassword,
  onExport,
  onSelectedChange,
}: {
  petugas: Petugas[];
  onAdd?: () => void;
  onEdit?: (p: Petugas) => void;
  onDelete?: (p: Petugas) => void;
  onView?: (p: Petugas) => void;
  onResetPassword?: (p: Petugas) => void;
  onExport?: () => void;
  onSelectedChange?: (ids: string[]) => void;
}) {
  return (
    <DataTable
      data={petugas}
      columns={columns}
      getRowId={(p) => p.nip}
      searchKeys={["nama", "nip", "unitKerja"]}
      searchPlaceholder="Cari Nama atau NIP..."
      filters={[
        {
          id: "unitKerja",
          placeholder: "Semua Kelurahan",
          options: UNIT_KERJA,
          matches: (p, value) => p.unitKerja === value,
        },
        {
          id: "status",
          placeholder: "Semua Status",
          options: [
            { value: "Active", label: "Active" },
            { value: "Pending", label: "Pending" },
            { value: "Disabled", label: "Disabled" },
          ],
          matches: (p, value) => p.status === value,
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
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-surface-container border border-outline-variant text-on-surface rounded-lg hover:bg-surface-container-high transition-colors font-label-md text-label-md"
          >
            <Download className="size-[18px]" />
            <span>Export Data</span>
          </button>
          <button
            type="button"
            onClick={onAdd}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-lg hover:bg-primary-fixed-variant transition-colors font-label-md text-label-md shadow-sm"
          >
            <Plus className="size-[18px]" />
            <span>Tambah Petugas</span>
          </button>
        </>
      }
      actions={() => [
        {
          label: "Lihat Detail",
          icon: Eye,
          className: "hover:text-primary hover:bg-primary-container/20",
          onClick: (p) => onView?.(p),
        },
        {
          label: "Edit",
          icon: Pencil,
          className: "hover:text-primary hover:bg-primary-container/20",
          onClick: (p) => onEdit?.(p),
        },
        {
          label: "Reset Password",
          icon: KeyRound,
          className: "hover:text-tertiary hover:bg-tertiary-container/20",
          onClick: (p) => onResetPassword?.(p),
        },
        {
          label: "Hapus",
          icon: Trash2,
          className: "hover:text-error hover:bg-error-container/20",
          onClick: (p) => onDelete?.(p),
        },
      ]}
    />
  );
}