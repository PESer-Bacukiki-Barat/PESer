"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Download, Plus } from "lucide-react";

import { DataTable, type Column } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EditJenisSampahModal } from "@/components/admin/jenis-sampah-edit-modal";
import { TambahJenisSampahModal } from "@/components/admin/jenis-sampah-tambah-modal";
import { deleteAction, editAction } from "@/components/admin/row-actions";
import { api, apiError } from "@/lib/api";
import { KATEGORI, type JenisSampah, type JenisSampahStatus } from "@/lib/jenis-sampah-data";

const STATUS_VARIANT: Record<JenisSampahStatus, "secondary" | "outline"> = {
  Aktif: "secondary",
  "Non-aktif": "outline",
};

const STATUS_LABEL: (j: JenisSampah) => JenisSampahStatus = (j) =>
  j.isActive ? "Aktif" : "Non-aktif";

export type { JenisSampah, JenisSampahStatus } from "@/lib/jenis-sampah-data";
import { fmtRupiah } from "@/lib/format";

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
    id: "satuan",
    header: "Satuan",
    cell: (j) => <p className="text-on-surface-variant">{j.satuan}</p>,
  },
  {
    id: "harga",
    header: "Harga",
    align: "right",
    cell: (j) => (
      <p className="font-label-sm text-label-sm text-right text-on-surface">
        {fmtRupiah(j.harga)}
      </p>
    ),
  },
  {
    id: "deskripsi",
    header: "Deskripsi",
    className: "hidden lg:table-cell",
    cell: (j) => (
      <p className="font-body-md text-body-md text-on-surface-variant truncate max-w-xs">{j.deskripsi}</p>
    ),
  },
  {
    id: "status",
    header: "Status",
    align: "center",
    cell: (j) => <Badge variant={STATUS_VARIANT[STATUS_LABEL(j)]}>{STATUS_LABEL(j)}</Badge>,
  },
];

export function JenisSampahTable({ jenisSampahs }: { jenisSampahs: JenisSampah[] }) {
  const router = useRouter();
  const [items, setItems] = useState<JenisSampah[]>(jenisSampahs);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<JenisSampah | null>(null);
  const [deleting, setDeleting] = useState<JenisSampah | null>(null);
  const [deletingLoading, setDeletingLoading] = useState(false);

  function handleEditSaved(values: JenisSampah) {
    if (!editing) return;
    setItems((prev) => prev.map((j) => (j.id === editing.id ? { ...j, ...values } : j)));
    setEditing(null);
  }

  function handleAdded(values: JenisSampah) {
    setItems((prev) => [...prev, values]);
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeletingLoading(true);
    try {
      await api.delete(`/jenis-sampah/${deleting.id}`);
      setItems((prev) => prev.filter((j) => j.id !== deleting.id));
      setDeleting(null);
      router.refresh();
    } catch (err) {
      alert(apiError(err));
    } finally {
      setDeletingLoading(false);
    }
  }

  return (
    <>
      <DataTable
        data={items}
        columns={columns}
        getRowId={(j) => j.id}
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
            matches: (j, value) => STATUS_LABEL(j) === value,
          },
        ]}
        pageSize={10}
        toolbarActions={
          <>
            <Button variant="outline" onClick={() => window.print()} className="h-10 px-4 font-medium">
              <Download className="size-[18px]" />
              <span className="hidden sm:inline">Export Data</span>
            </Button>
            <Button onClick={() => setAdding(true)} className="h-10 px-4 font-semibold">
              <Plus className="size-[18px]" />
              <span className="hidden sm:inline">Tambah Jenis Sampah</span>
            </Button>
          </>
        }
        actions={(j) => [
          editAction(() => setEditing(j)),
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
          onSaved={handleEditSaved}
        />
      )}

      <TambahJenisSampahModal
        open={adding}
        onOpenChange={setAdding}
        onSaved={handleAdded}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        loading={deletingLoading}
        title="Hapus Jenis Sampah"
        description={
          deleting
            ? `Apakah Anda yakin ingin menghapus jenis sampah "${deleting.nama}" (${deleting.kode})?`
            : undefined
        }
        onConfirm={confirmDelete}
      />
    </>
  );
}
