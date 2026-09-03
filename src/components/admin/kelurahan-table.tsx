"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus } from "lucide-react";

import { DataTable, type Column } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EditKelurahanModal } from "@/components/admin/kelurahan-edit-modal";
import { AddKelurahanModal } from "@/components/admin/kelurahan-add-modal";
import { deleteAction, editAction } from "@/components/admin/row-actions";
import { api, apiError } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import type { Kelurahan } from "@/lib/kelurahan-data";
import { fmtTanggal } from "@/lib/format";

const columns: Column<Kelurahan>[] = [
  {
    id: "kodeWilayah",
    header: "Kode Wilayah",
    cell: (k) => <span className="font-mono font-label-md text-label-md text-on-surface">{k.kodeWilayah}</span>,
  },
  {
    id: "nama",
    header: "Nama Kelurahan",
    cell: (k) => <p className="font-medium text-on-surface">{k.nama}</p>,
  },
  {
    id: "createdAt",
    header: "Dibuat",
    cell: (k) =>
      k.createdAt ? (
        <p className="text-on-surface-variant">{fmtTanggal(k.createdAt)}</p>
      ) : (
        <span className="text-on-surface-variant">—</span>
      ),
  },
];

export function KelurahanTable({ kelurahans }: { kelurahans: Kelurahan[] }) {
  const router = useRouter();
  const toast = useToast();
  const [items, setItems] = useState<Kelurahan[]>(kelurahans);
  const [editing, setEditing] = useState<Kelurahan | null>(null);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<Kelurahan | null>(null);
  const [deletingLoading, setDeletingLoading] = useState(false);

  function refresh() {
    router.refresh();
  }

  async function handleEdit(values: { nama: string; kodeWilayah: string }) {
    if (!editing) return;
    try {
      await api.put(`/kelurahan/${editing.id}`, values);
      setItems((prev) =>
        prev.map((k) => (k.id === editing.id ? { ...k, ...values } : k)),
      );
      toast.sukses("Kelurahan diperbarui");
      setEditing(null);
      refresh();
    } catch (err) {
      toast.gagal("Gagal memperbarui", apiError(err));
    }
  }

  async function handleCreate(values: { nama: string; kodeWilayah: string }) {
    try {
      const { data } = await api.post<Kelurahan>("/kelurahan", values);
      setItems((prev) => [...prev, data]);
      toast.sukses("Kelurahan ditambahkan");
      setAdding(false);
      refresh();
    } catch (err) {
      toast.gagal("Gagal menambahkan", apiError(err));
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeletingLoading(true);
    try {
      await api.delete(`/kelurahan/${deleting.id}`);
      setItems((prev) => prev.filter((x) => x.id !== deleting.id));
      toast.sukses("Kelurahan dihapus");
      setDeleting(null);
      refresh();
    } catch (err) {
      toast.gagal("Gagal menghapus", apiError(err));
    } finally {
      setDeletingLoading(false);
    }
  }

  return (
    <>
      <DataTable
        data={items}
        columns={columns}
        getRowId={(k) => k.id}
        searchKeys={["nama", "kodeWilayah"]}
        searchPlaceholder="Cari nama atau kode wilayah..."
        pageSize={10}
        toolbarActions={
          <Button onClick={() => setAdding(true)} className="h-10 px-4 font-semibold">
            <Plus className="size-4" aria-hidden />
            <span className="hidden sm:inline">Tambah Kelurahan</span>
          </Button>
        }
        actions={(k) => [
          editAction(() => setEditing(k)),
          deleteAction(() => setDeleting(k)),
        ]}
        emptyState={
          <p className="text-center text-on-surface-variant">
            Tidak ada kelurahan ditemukan.
          </p>
        }
      />

      {editing && (
        <EditKelurahanModal
          kelurahan={editing}
          open
          onOpenChange={(open) => {
            if (!open) setEditing(null);
          }}
          onSubmit={handleEdit}
        />
      )}

      <AddKelurahanModal
        open={adding}
        onOpenChange={setAdding}
        onSubmit={handleCreate}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title="Hapus Kelurahan"
        description={
          deleting
            ? `Apakah Anda yakin ingin menghapus kelurahan "${deleting.nama}" (${deleting.kodeWilayah})?`
            : undefined
        }
        loading={deletingLoading}
        onConfirm={confirmDelete}
      />
    </>
  );
}
