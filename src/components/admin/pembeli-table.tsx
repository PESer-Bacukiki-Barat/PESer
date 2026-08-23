"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus } from "lucide-react";

import { DataTable, type Column } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Modal } from "@/components/ui/modal";
import { PembeliForm } from "@/components/admin/pembeli-form";
import { EditPembeliModal } from "@/components/admin/pembeli-edit-modal";
import { deleteAction, editAction } from "@/components/admin/row-actions";
import { api, apiError } from "@/lib/api";
import type { Pembeli } from "@/lib/pembeli-data";

export type { Pembeli } from "@/lib/pembeli-data";

const STATUS_VARIANT = {
  aktif: "default",
  "non-aktif": "outline",
} as const;

const columns: Column<Pembeli>[] = [
  {
    id: "nama",
    header: "Nama",
    cell: (p) => <p className="font-medium text-on-surface">{p.nama}</p>,
  },
  {
    id: "perusahaan",
    header: "Perusahaan",
    cell: (p) => (
      <p className="text-on-surface-variant">{p.perusahaan ?? "-"}</p>
    ),
  },
  {
    id: "noHp",
    header: "No. HP",
    cell: (p) => <p className="font-label-md text-label-md text-on-surface">{p.noHp}</p>,
  },
  {
    id: "alamat",
    header: "Alamat",
    className: "hidden lg:table-cell max-w-[200px]",
    cell: (p) => (
      <p className="text-on-surface-variant truncate" title={p.alamat}>
        {p.alamat}
      </p>
    ),
  },
  {
    id: "catatan",
    header: "Catatan",
    className: "hidden xl:table-cell max-w-[150px]",
    cell: (p) => (
      <p className="text-on-surface-variant truncate" title={p.catatan ?? undefined}>
        {p.catatan ?? "-"}
      </p>
    ),
  },
  {
    id: "status",
    header: "Status",
    align: "center",
    cell: (p) => {
      const status = p.isActive ? "aktif" : "non-aktif";
      return <Badge variant={STATUS_VARIANT[status]}>{p.isActive ? "Aktif" : "Non-aktif"}</Badge>;
    },
  },
];

export function PembeliTable({ pembelis }: { pembelis: Pembeli[] }) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Pembeli | null>(null);
  const [deleting, setDeleting] = useState<Pembeli | null>(null);
  const [deletingLoading, setDeletingLoading] = useState(false);

  async function confirmDelete() {
    if (!deleting) return;
    setDeletingLoading(true);
    try {
      await api.delete(`/pembeli/${deleting.id}`);
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
        data={pembelis}
        columns={columns}
        getRowId={(p) => p.id}
        searchKeys={["nama", "perusahaan", "noHp", "alamat"]}
        searchPlaceholder="Cari Nama, Perusahaan, atau No. HP..."
        filters={[
          {
            id: "status",
            placeholder: "Semua Status",
            options: [
              { value: "aktif", label: "Aktif" },
              { value: "non-aktif", label: "Non-aktif" },
            ],
            matches: (p, value) => (p.isActive ? "aktif" : "non-aktif") === value,
          },
        ]}
        pageSize={10}
        toolbarActions={
          <Button onClick={() => setAdding(true)} className="h-10 px-4 font-semibold">
            <Plus className="size-[18px]" />
            <span className="hidden sm:inline">Tambah Pembeli</span>
          </Button>
        }
        actions={(p) => [
          editAction(() => setEditing(p)),
          deleteAction(() => setDeleting(p)),
        ]}
        emptyState={
          <p className="text-center text-on-surface-variant">
            Tidak ada pembeli ditemukan.
          </p>
        }
      />

      <Modal
        title="Tambah Pembeli"
        description="Daftarkan pembeli sampah baru ke dalam sistem."
        open={adding}
        onOpenChange={setAdding}
        size="md"
      >
        <PembeliForm
          bare
          submitLabel="Simpan"
          cancelLabel="Batal"
          onSaved={() => setAdding(false)}
          onCancel={() => setAdding(false)}
        />
      </Modal>

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
        loading={deletingLoading}
        onConfirm={confirmDelete}
      />
    </>
  );
}
