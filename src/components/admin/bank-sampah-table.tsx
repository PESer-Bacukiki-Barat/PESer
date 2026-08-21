"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";

import { DataTable, type Column } from "@/components/ui/data-table";
import { EditBankSampahModal } from "@/components/admin/bank-sampah-edit-modal";
import { api, apiError } from "@/lib/api";
import type { BankSampah, BankSampahPayload, BankSampahStatus } from "@/lib/bank-sampah-data";
import type { SelectOption } from "@/components/admin/form-fields";

const STATUS_STYLES: Record<BankSampahStatus, string> = {
  Active: "bg-secondary-container text-on-secondary-container border border-secondary-fixed",
  "Non-aktif": "bg-surface-variant text-on-surface-variant border border-outline-variant",
};

export function BankSampahTable({
  bankSampah,
  kelurahanOptions,
}: {
  bankSampah: BankSampah[];
  kelurahanOptions: SelectOption[];
}) {
  const router = useRouter();
  const [items, setItems] = useState<BankSampah[]>(bankSampah);
  const [editing, setEditing] = useState<BankSampah | null>(null);

  const kelurahanName = (id: string) =>
    kelurahanOptions.find((o) => o.value === id)?.label ?? id;

  function refresh() {
    router.refresh();
  }

  async function handleEdit(values: BankSampahPayload) {
    if (!editing) return;
    try {
      await api.put(`/bank-sampah/${editing.id}`, values);
      setItems((prev) => prev.map((b) => (b.id === editing.id ? { ...b, ...values } : b)));
      setEditing(null);
      refresh();
    } catch (err) {
      alert(apiError(err));
    }
  }

  async function handleDelete(b: BankSampah) {
    if (!confirm(`Hapus bank sampah "${b.nama}"?`)) return;
    try {
      await api.delete(`/bank-sampah/${b.id}`);
      setItems((prev) => prev.filter((x) => x.id !== b.id));
      refresh();
    } catch (err) {
      alert(apiError(err));
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
      cell: (b) => <p className="text-on-surface-variant">{kelurahanName(b.kelurahanId)}</p>,
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
      id: "status",
      header: "Status",
      align: "center",
      cell: (b) => {
        const status: BankSampahStatus = b.isActive ? "Active" : "Non-aktif";
        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-label-sm text-label-sm ${STATUS_STYLES[status]}`}
          >
            {status}
          </span>
        );
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
          <Link
            href="/admin/bank-sampah/tambah"
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-primary text-white hover:bg-primary-fixed-variant transition-colors shadow-sm font-label-md text-label-md font-semibold"
          >
            <Plus className="size-[18px]" />
            <span className="hidden sm:inline">Tambah Bank Sampah</span>
          </Link>
        }
        actions={(b) => [
          {
            label: "Edit",
            icon: Pencil,
            className: "hover:text-primary",
            onClick: () => setEditing(b),
          },
          {
            label: "Hapus",
            icon: Trash2,
            className: "hover:text-error hover:bg-error-container",
            onClick: () => handleDelete(b),
          },
        ]}
        emptyState={
          <p className="text-center text-on-surface-variant">Tidak ada bank sampah ditemukan.</p>
        }
      />

      {editing && (
        <EditBankSampahModal
          bankSampah={editing}
          kelurahanOptions={kelurahanOptions}
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
