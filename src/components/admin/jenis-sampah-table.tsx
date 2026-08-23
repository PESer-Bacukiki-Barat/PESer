"use client";

import Link from "next/link";
import { useState } from "react";
import { Download, Plus } from "lucide-react";

import { DataTable, type Column } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EditJenisSampahModal } from "@/components/admin/jenis-sampah-edit-modal";
import { deleteAction, editAction, viewAction } from "@/components/admin/row-actions";
import { KATEGORI, type JenisSampah, type JenisSampahStatus } from "@/lib/jenis-sampah-data";

export type { JenisSampah, JenisSampahStatus } from "@/lib/jenis-sampah-data";

const STATUS_VARIANT: Record<JenisSampahStatus, "secondary" | "outline"> = {
  Aktif: "secondary",
  "Non-aktif": "outline",
};

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
      <Badge variant={STATUS_VARIANT[j.status]}>{j.status}</Badge>
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
  const [editing, setEditing] = useState<JenisSampah | null>(null);
  const [deleting, setDeleting] = useState<JenisSampah | null>(null);

  return (
    <>
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
          <Button variant="outline" onClick={onExport} className="h-10 px-4 font-medium">
            <Download className="size-[18px]" />
            <span className="hidden sm:inline">Export Data</span>
          </Button>
          <Button render={<Link href="/admin/jenis-sampah/tambah" />} nativeButton={false} className="h-10 px-4 font-semibold">
            <Plus className="size-[18px]" />
            <span className="hidden sm:inline">Tambah Jenis Sampah</span>
          </Button>
        </>
      }
      actions={(j) => [
        viewAction(() => onView?.(j)),
        editAction(() => {
          onEdit?.(j);
          setEditing(j);
        }),
          deleteAction(() => setDeleting(j)),
      ]}
      emptyState={
        <p className="text-center text-on-surface-variant">
          Tidak ada jenis sampah ditemukan.
        </p>
      }
      />

      {editing && (
        <EditJenisSampahModal
          jenisSampah={editing}
          open
          onOpenChange={(open) => {
            if (!open) setEditing(null);
          }}
        />
      )}

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title="Hapus Jenis Sampah"
        description={
          deleting
            ? `Apakah Anda yakin ingin menghapus jenis sampah "${deleting.nama}" (${deleting.kode})?`
            : undefined
        }
        onConfirm={() => {
          if (deleting) onDelete?.(deleting);
          setDeleting(null);
        }}
      />
    </>
  );
}
