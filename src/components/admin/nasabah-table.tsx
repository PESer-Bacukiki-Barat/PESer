"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus } from "lucide-react";

import { DataTable, type Column } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Modal } from "@/components/ui/modal";
import { NasabahForm } from "@/components/admin/nasabah-form";
import { EditNasabahModal } from "@/components/admin/nasabah-edit-modal";
import { deleteAction, editAction } from "@/components/admin/row-actions";
import { api, apiError } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import type { Nasabah } from "@/lib/nasabah-data";
import type { SelectOption } from "@/components/admin/form-fields";

export type { Nasabah } from "@/lib/nasabah-data";

const STATUS_VARIANT = {
  aktif: "default",
  "non-aktif": "outline",
} as const;

export function NasabahTable({
  nasabahs,
  bankSampahOptions,
}: {
  nasabahs: Nasabah[];
  bankSampahOptions: SelectOption[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Nasabah | null>(null);
  const [deleting, setDeleting] = useState<Nasabah | null>(null);
  const [deletingLoading, setDeletingLoading] = useState(false);

  const bankSampahName = (id: string) =>
    bankSampahOptions.find((o) => o.value === id)?.label ?? id;

  async function confirmDelete() {
    if (!deleting) return;
    setDeletingLoading(true);
    try {
      await api.delete(`/nasabah/${deleting.id}`);
      toast.sukses("Nasabah dihapus");
      setDeleting(null);
      router.refresh();
    } catch (err) {
      toast.gagal("Gagal menghapus", apiError(err));
    } finally {
      setDeletingLoading(false);
    }
  }

  const indexById = new Map<string, number>();
  nasabahs.forEach((n, i) => indexById.set(n.id, i + 1));

  const columns: Column<Nasabah>[] = [
    {
      id: "no",
      header: "No",
      cell: (n) => (
        <p className="font-label-md text-label-md font-mono text-on-surface-variant">
          {indexById.get(n.id)}
        </p>
      ),
    },
    {
      id: "kodeNasabah",
      header: "Kode",
      cell: (n) => (
        <p className="font-label-md text-label-md font-mono text-primary whitespace-nowrap">
          {n.kodeNasabah}
        </p>
      ),
    },
    {
      id: "bankSampahId",
      header: "Bank Sampah",
      cell: (n) => (
        <p className="text-on-surface whitespace-nowrap">{bankSampahName(n.bankSampahId)}</p>
      ),
    },
    {
      id: "nama",
      header: "Nama",
      cell: (n) => <p className="font-medium text-on-surface">{n.nama}</p>,
    },
    {
      id: "noHp",
      header: "No. HP",
      cell: (n) => <p className="font-label-md text-label-md text-on-surface">{n.noHp ?? "-"}</p>,
    },
    {
      id: "alamat",
      header: "Alamat",
      className: "hidden lg:table-cell max-w-[200px]",
      cell: (n) => (
        <p className="text-on-surface-variant truncate" title={n.alamat}>
          {n.alamat}
        </p>
      ),
    },
    {
      id: "rt",
      header: "RT/RW",
      cell: (n) => (
        <p className="font-label-md text-label-md text-on-surface whitespace-nowrap">
          {n.rt} / {n.rw}
        </p>
      ),
    },
    {
      id: "status",
      header: "Status",
      align: "center",
      cell: (n) => {
        const status = n.isActive ? "aktif" : "non-aktif";
        return <Badge variant={STATUS_VARIANT[status]}>{n.isActive ? "Aktif" : "Non-aktif"}</Badge>;
      },
    },
  ];

  return (
    <>
      <DataTable
        data={nasabahs}
        columns={columns}
        getRowId={(n) => n.id}
        searchKeys={["kodeNasabah", "nama", "noHp", "alamat"]}
        searchPlaceholder="Cari Kode, Nama, No. HP, atau Alamat..."
        filters={[
          {
            id: "bankSampahId",
            placeholder: "Semua Bank Sampah",
            options: bankSampahOptions,
            matches: (n, value) => n.bankSampahId === value,
          },
          {
            id: "status",
            placeholder: "Semua Status",
            options: [
              { value: "aktif", label: "Aktif" },
              { value: "non-aktif", label: "Non-aktif" },
            ],
            matches: (n, value) => (n.isActive ? "aktif" : "non-aktif") === value,
          },
        ]}
        pageSize={10}
        toolbarActions={
          <Button onClick={() => setAdding(true)} className="h-10 px-4 font-semibold">
            <Plus className="size-4" aria-hidden />
            <span className="hidden sm:inline">Tambah Nasabah</span>
          </Button>
        }
        actions={(n) => [
          editAction(() => setEditing(n)),
          deleteAction(() => setDeleting(n)),
        ]}
        emptyState={
          <p className="text-center text-on-surface-variant">
            Tidak ada nasabah ditemukan.
          </p>
        }
      />

      <Modal
        title="Tambah Nasabah"
        description="Daftarkan nasabah penabung sampah baru ke dalam sistem."
        open={adding}
        onOpenChange={setAdding}
        size="md"
      >
        <NasabahForm
          bare
          bankSampahOptions={bankSampahOptions}
          submitLabel="Simpan"
          cancelLabel="Batal"
          onSaved={() => setAdding(false)}
          onCancel={() => setAdding(false)}
        />
      </Modal>

      {editing && (
        <EditNasabahModal
          nasabah={editing}
          open
          bankSampahOptions={bankSampahOptions}
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
        loading={deletingLoading}
        onConfirm={confirmDelete}
      />
    </>
  );
}
