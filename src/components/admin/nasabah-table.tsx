"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Download, Plus } from "lucide-react";

import { DataTable, type Column } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EditNasabahModal } from "@/components/admin/nasabah-edit-modal";
import { deleteAction, editAction, viewAction } from "@/components/admin/row-actions";
import {
  NASABAH_BANK_SAMPAH_OPTIONS,
  getBankSampahName,
  type Nasabah,
} from "@/lib/nasabah-data";

export type { Nasabah } from "@/lib/nasabah-data";

export function NasabahTable({
  nasabahs,
  onEdit,
  onDelete,
  onView,
  onExport,
  onSelectedChange,
}: {
  nasabahs: Nasabah[];
  onEdit?: (n: Nasabah) => void;
  onDelete?: (n: Nasabah) => void;
  onView?: (n: Nasabah) => void;
  onExport?: () => void;
  onSelectedChange?: (ids: string[]) => void;
}) {
  const [editing, setEditing] = useState<Nasabah | null>(null);
  const [deleting, setDeleting] = useState<Nasabah | null>(null);

  const indexById = useMemo(() => {
    const map = new Map<string, number>();
    nasabahs.forEach((n, i) => map.set(n.id, i + 1));
    return map;
  }, [nasabahs]);

  const columns = useMemo(
    () =>
      [
        {
          id: "no",
          header: "No",
          cell: (n: Nasabah) => (
            <p className="font-label-md text-label-md font-mono text-on-surface-variant">
              {indexById.get(n.id)}
            </p>
          ),
        },
        {
          id: "bankSampahId",
          header: "Nama Bank Sampah",
          cell: (n: Nasabah) => <p className="font-medium text-on-surface whitespace-nowrap">{getBankSampahName(n.bankSampahId)}</p>,
        },
        {
          id: "nama",
          header: "Nama",
          cell: (n: Nasabah) => <p className="font-medium text-on-surface">{n.nama}</p>,
        },
        {
          id: "noHp",
          header: "No. HP",
          cell: (n: Nasabah) => <p className="font-label-md text-label-md text-on-surface">{n.noHp}</p>,
        },
        {
          id: "alamat",
          header: "Alamat",
          className: "hidden lg:table-cell",
          cell: (n: Nasabah) => (
            <p className="text-on-surface-variant truncate max-w-[150px]" title={n.alamat}>
              {n.alamat}
            </p>
          ),
        },
        {
          id: "rt",
          header: "RT",
          cell: (n: Nasabah) => <p className="font-label-md text-label-md text-on-surface">{n.rt}</p>,
        },
        {
          id: "rw",
          header: "RW",
          cell: (n: Nasabah) => <p className="font-label-md text-label-md text-on-surface">{n.rw}</p>,
        },
        {
          id: "setoranId",
          header: "ID Setoran",
          cell: (n: Nasabah) => <p className="font-label-md text-label-md font-mono text-primary whitespace-nowrap">{n.setoranId}</p>,
        },
      ] as Column<Nasabah>[],
    [indexById],
  );

  return (
    <>
      <DataTable
        data={nasabahs}
        columns={columns}
        getRowId={(n) => n.id}
        searchKeys={["nama", "noHp", "alamat"]}
        searchPlaceholder="Cari Nama, No. HP, atau Alamat..."
        filters={[
          {
            id: "bankSampahId",
            placeholder: "Semua Bank Sampah",
            options: NASABAH_BANK_SAMPAH_OPTIONS,
            matches: (n, value) => n.bankSampahId === value,
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
            <Button render={<Link href="/admin/nasabah/tambah" />} nativeButton={false} className="h-10 px-4 font-semibold">
              <Plus className="size-[18px]" />
              <span className="hidden sm:inline">Tambah Nasabah</span>
            </Button>
          </>
        }
        actions={(n) => [
          viewAction(() => onView?.(n)),
          editAction(() => {
            onEdit?.(n);
            setEditing(n);
          }),
          deleteAction(() => setDeleting(n)),
        ]}
        emptyState={
          <p className="text-center text-on-surface-variant">
            Tidak ada nasabah ditemukan.
          </p>
        }
      />

      {editing && (
        <EditNasabahModal
          nasabah={editing}
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
        title="Hapus Nasabah"
        description={
          deleting
            ? `Apakah Anda yakin ingin menghapus nasabah "${deleting.nama}"?`
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