"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Download, Eye, Pencil, Plus, Trash2 } from "lucide-react";

import { DataTable, type Column } from "@/components/ui/data-table";
import { EditBankSampahModal } from "@/components/admin/bank-sampah-edit-modal";
import {
  KELURAHAN,
  formatNumber,
  stockTotalBerat,
  stockTotalTersedia,
  type BankSampah,
  type BankSampahStatus,
} from "@/lib/bank-sampah-data";

export type { BankSampah, BankSampahStatus } from "@/lib/bank-sampah-data";

const STATUS_STYLES: Record<BankSampahStatus, string> = {
  Active: "bg-secondary-container text-on-secondary-container border border-secondary-fixed",
  "Non-aktif": "bg-surface-variant text-on-surface-variant border border-outline-variant",
};

export function BankSampahTable({
  bankSampah,
  onEdit,
  onDelete,
  onView,
  onExport,
  onSelectedChange,
}: {
  bankSampah: BankSampah[];
  onEdit?: (b: BankSampah) => void;
  onDelete?: (b: BankSampah) => void;
  onView?: (b: BankSampah) => void;
  onExport?: () => void;
  onSelectedChange?: (ids: string[]) => void;
}) {
  const [editing, setEditing] = useState<BankSampah | null>(null);

  const indexById = useMemo(() => {
    const map = new Map<string, number>();
    bankSampah.forEach((b, i) => map.set(b.id, i + 1));
    return map;
  }, [bankSampah]);

  const columns: Column<BankSampah>[] = useMemo(
    () => [
      {
        id: "no",
        header: "No",
        cell: (b) => (
          <p className="font-label-md text-label-md font-mono text-on-surface-variant">
            {indexById.get(b.id)}
          </p>
        ),
      },
      {
        id: "nama",
        header: "Nama",
        cell: (b) => <p className="font-medium text-on-surface whitespace-nowrap">{b.nama}</p>,
      },
      {
        id: "kelurahan",
        header: "Kelurahan",
        cell: (b) => <p className="text-on-surface-variant">{b.kelurahan}</p>,
      },
      {
        id: "alamat",
        header: "Alamat",
        className: "max-w-[200px]",
        cell: (b) => (
          <p className="truncate text-on-surface-variant" title={b.alamat}>
            {b.alamat}
          </p>
        ),
      },
      {
        id: "latitude",
        header: "Latitude",
        align: "right",
        cell: (b) => (
          <p className="font-label-md text-label-md font-mono text-on-surface-variant">
            {b.latitude.toFixed(4)}
          </p>
        ),
      },
      {
        id: "longitude",
        header: "Longitude",
        align: "right",
        cell: (b) => (
          <p className="font-label-md text-label-md font-mono text-on-surface-variant">
            {b.longitude.toFixed(4)}
          </p>
        ),
      },
      {
        id: "stock",
        header: "Total Stock",
        align: "right",
        className: "hidden md:table-cell",
        cell: (b) => {
          const total = stockTotalBerat(b.stock);
          const tersedia = stockTotalTersedia(b.stock);
          return (
            <div className="text-right">
              <p className="font-label-md text-label-md font-mono text-on-surface font-semibold">
                {formatNumber(total)} kg
              </p>
              {total > 0 && tersedia < total && (
                <p className="font-label-xs text-label-xs text-on-surface-variant">
                  tersedia {formatNumber(tersedia)} kg
                </p>
              )}
            </div>
          );
        },
      },
      {
        id: "status",
        header: "Status",
        align: "center",
        cell: (b) => (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-label-sm text-label-sm ${STATUS_STYLES[b.status]}`}
          >
            {b.status}
          </span>
        ),
      },
    ],
    [indexById],
  );

  return (
    <>
      <DataTable
      data={bankSampah}
      columns={columns}
      getRowId={(b) => b.id}
      searchKeys={["nama", "kelurahan", "alamat"]}
      searchPlaceholder="Cari Nama Bank Sampah..."
      filters={[
        {
          id: "kelurahan",
          placeholder: "Semua Kelurahan",
          options: KELURAHAN,
          matches: (b, value) => b.kelurahan === value,
        },
        {
          id: "status",
          placeholder: "Semua Status",
          options: [
            { value: "Active", label: "Active" },
            { value: "Non-aktif", label: "Non-aktif" },
          ],
          matches: (b, value) => b.status === value,
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
            <span>Export</span>
          </button>
          <Link
            href="/admin/bank-sampah/tambah"
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-primary text-on-primary text-white rounded-lg hover:bg-primary-fixed-variant transition-colors font-label-md text-label-md shadow-sm"
          >
            <Plus className="size-[18px]" />
            <span>Tambah Bank Sampah</span>
          </Link>
        </>
      }
      actions={() => [
        {
          label: "Lihat Detail",
          icon: Eye,
          className: "hover:text-primary hover:bg-primary-container/20",
          onClick: (b) => onView?.(b),
        },
        {
          label: "Edit",
          icon: Pencil,
          className: "hover:text-primary hover:bg-primary-container/20",
          onClick: (b) => {
            onEdit?.(b);
            setEditing(b);
          },
        },
        {
          label: "Hapus",
          icon: Trash2,
          className: "hover:text-error hover:bg-error-container/20",
          onClick: (b) => onDelete?.(b),
        },
      ]}
      />

      {editing && (
        <EditBankSampahModal
          bankSampah={editing}
          open
          onOpenChange={(open) => {
            if (!open) setEditing(null);
          }}
        />
      )}
    </>
  );
}