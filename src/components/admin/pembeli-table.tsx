"use client";

import Link from "next/link";
import { useState } from "react";
import { Download, Plus } from "lucide-react";

import { DataTable, type Column } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EditPembeliModal } from "@/components/admin/pembeli-edit-modal";
import { deleteAction, editAction, viewAction } from "@/components/admin/row-actions";
import { PERUSAHAAN, type Pembeli, type PembeliStatus } from "@/lib/pembeli-data";

export type { Pembeli, PembeliStatus } from "@/lib/pembeli-data";

const STATUS_VARIANT: Record<PembeliStatus, "default" | "outline"> = {
  Aktif: "default",
  "Non-aktif": "outline",
};

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
      <Badge variant={STATUS_VARIANT[p.status]}>{p.status}</Badge>
    ),
  },
];

export function PembeliTable({
  pembelis,
  onEdit,
  onDelete,
  onView,
  onExport,
  onSelectedChange,
}: {
  pembelis: Pembeli[];
  onEdit?: (p: Pembeli) => void;
  onDelete?: (p: Pembeli) => void;
  onView?: (p: Pembeli) => void;
  onExport?: () => void;
  onSelectedChange?: (ids: string[]) => void;
}) {
  const [editing, setEditing] = useState<Pembeli | null>(null);
  const [deleting, setDeleting] = useState<Pembeli | null>(null);

  return (
    <>
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
            <Button variant="outline" onClick={onExport} className="h-10 px-4 font-medium">
              <Download className="size-[18px]" />
              <span className="hidden sm:inline">Export Data</span>
            </Button>
            <Button render={<Link href="/admin/pembeli/tambah" />} nativeButton={false} className="h-10 px-4 font-semibold">
              <Plus className="size-[18px]" />
              <span className="hidden sm:inline">Tambah Pembeli</span>
            </Button>
          </>
        }
        actions={(p) => [
          viewAction(() => onView?.(p)),
          editAction(() => {
            onEdit?.(p);
            setEditing(p);
          }),
          deleteAction(() => setDeleting(p)),
        ]}
        emptyState={
          <p className="text-center text-on-surface-variant">
            Tidak ada pembeli ditemukan.
          </p>
        }
      />

      {editing && (
        <EditPembeliModal
          pembeli={editing}
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
        title="Hapus Pembeli"
        description={
          deleting
            ? `Apakah Anda yakin ingin menghapus pembeli "${deleting.nama}"?`
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