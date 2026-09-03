"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus } from "lucide-react";

import { DataTable, type Column } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { deleteAction, editAction } from "@/components/admin/row-actions";
import { api, apiError } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import type { BankSampah, BankSampahStatus } from "@/lib/bank-sampah-data";
import type { SelectOption } from "@/components/admin/form-fields";

const STATUS_VARIANT: Record<BankSampahStatus, "secondary" | "outline"> = {
  Active: "secondary",
  "Non-aktif": "outline",
};

export function BankSampahTable({
  bankSampah,
  kelurahanOptions,
}: {
  bankSampah: BankSampah[];
  kelurahanOptions: SelectOption[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [items, setItems] = useState<BankSampah[]>(bankSampah);
  const [deleting, setDeleting] = useState<BankSampah | null>(null);
  const [deletingLoading, setDeletingLoading] = useState(false);

  const kelurahanName = (id: string) =>
    kelurahanOptions.find((o) => o.value === id)?.label ?? id;

  function refresh() {
    router.refresh();
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeletingLoading(true);
    try {
      await api.delete(`/bank-sampah/${deleting.id}`);
      setItems((prev) => prev.filter((x) => x.id !== deleting.id));
      toast.sukses("Bank sampah dihapus");
      setDeleting(null);
      refresh();
    } catch (err) {
      toast.gagal("Gagal menghapus", apiError(err));
    } finally {
      setDeletingLoading(false);
    }
  }

  const columns: Column<BankSampah>[] = [
    {
      id: "nama",
      header: "Nama",
      cell: (b) => <p className="font-medium text-on-surface whitespace-nowrap">{b.nama}</p>,
    },
    {
      id: "kelurahan",
      header: "Kelurahan",
      cell: (b) => (
        <p className="text-on-surface-variant">
          {b.kelurahanNama ?? kelurahanName(b.kelurahanId)}
        </p>
      ),
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
    // {
    //   id: "latitude",
    //   header: "Latitude",
    //   align: "right",
    //   cell: (b) => (
    //     <p className="font-label-md text-label-md font-mono text-on-surface-variant">
    //       {b.latitude.toFixed(4)}
    //     </p>
    //   ),
    // },
    // {
    //   id: "longitude",
    //   header: "Longitude",
    //   align: "right",
    //   cell: (b) => (
    //     <p className="font-label-md text-label-md font-mono text-on-surface-variant">
    //       {b.longitude.toFixed(4)}
    //     </p>
    //   ),
    // },
    {
      id: "status",
      header: "Status",
      align: "center",
      cell: (b) => {
        const status: BankSampahStatus = b.isActive ? "Active" : "Non-aktif";
        return <Badge variant={STATUS_VARIANT[status]}>{status}</Badge>;
      },
    },
  ];

  return (
    <>
      <DataTable
        data={items}
        columns={columns}
        getRowId={(b) => b.id}
        searchKeys={["nama", "alamat"]}
        searchPlaceholder="Cari Nama Bank Sampah..."
        filters={[
          {
            id: "kelurahan",
            placeholder: "Semua Kelurahan",
            options: kelurahanOptions,
            matches: (b, value) => b.kelurahanId === value,
          },
          {
            id: "status",
            placeholder: "Semua Status",
            options: [
              { value: "Active", label: "Active" },
              { value: "Non-aktif", label: "Non-aktif" },
            ],
            matches: (b, value) => (b.isActive ? "Active" : "Non-aktif") === value,
          },
        ]}
        pageSize={10}
        toolbarActions={
          <Button render={<Link href="/admin/bank-sampah/tambah" />} nativeButton={false} className="h-10 px-4 font-semibold">
            <Plus className="size-4" aria-hidden />
            <span className="hidden sm:inline">Tambah Bank Sampah</span>
          </Button>
        }
        actions={(b) => [
          editAction(() => router.push(`/admin/bank-sampah/${b.id}/edit`)),
          deleteAction(() => setDeleting(b)),
        ]}
        emptyState={
          <p className="text-center text-on-surface-variant">Tidak ada bank sampah ditemukan.</p>
        }
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title="Hapus Bank Sampah"
        description={
          deleting
            ? `Apakah Anda yakin ingin menghapus bank sampah "${deleting.nama}"?`
            : undefined
        }
        loading={deletingLoading}
        onConfirm={confirmDelete}
      />
    </>
  );
}
