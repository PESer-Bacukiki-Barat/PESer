"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";

import { DataTable, type Column } from "@/components/ui/data-table";
import { EditKelurahanModal } from "@/components/admin/kelurahan-edit-modal";
import { api, apiError } from "@/lib/api";
import type { Kelurahan } from "@/lib/kelurahan-data";

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
        <p className="text-on-surface-variant">{new Date(k.createdAt).toLocaleDateString("id-ID")}</p>
      ) : (
        <span className="text-on-surface-variant">—</span>
      ),
  },
];

export function KelurahanTable({ kelurahans }: { kelurahans: Kelurahan[] }) {
  const router = useRouter();
  const [items, setItems] = useState<Kelurahan[]>(kelurahans);
  const [editing, setEditing] = useState<Kelurahan | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
      setEditing(null);
      refresh();
    } catch (err) {
      alert(apiError(err));
    }
  }

  async function handleDelete(k: Kelurahan) {
    if (!confirm(`Hapus kelurahan "${k.nama}"?`)) return;
    setDeletingId(k.id);
    try {
      await api.delete(`/kelurahan/${k.id}`);
      setItems((prev) => prev.filter((x) => x.id !== k.id));
      refresh();
    } catch (err) {
      alert(apiError(err));
    } finally {
      setDeletingId(null);
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
          <Link
            href="/admin/kelurahan/tambah"
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-primary text-white hover:bg-primary-fixed-variant transition-colors shadow-sm font-label-md text-label-md font-semibold"
          >
            <Plus className="size-[18px]" />
            <span className="hidden sm:inline">Tambah Kelurahan</span>
          </Link>
        }
        actions={(k) => [
          {
            label: "Edit",
            icon: Pencil,
            className: "hover:text-primary",
            onClick: () => setEditing(k),
          },
          {
            label: "Hapus",
            icon: Trash2,
            className: "hover:text-error hover:bg-error-container",
            onClick: () => handleDelete(k),
          },
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
    </>
  );
}
