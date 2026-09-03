"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";

import { DataTable, type Column } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { UsersEditModal } from "@/components/admin/users-edit-modal";
import { UsersAddModal } from "@/components/admin/users-add-modal";
import { deleteAction, editAction, viewAction } from "@/components/admin/row-actions";
import { api, apiError } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import {
  STATUS_OPTIONS,
  ROLE_OPTIONS,
  initialsClassOf,
  initialsOf,
  type UserRow,
} from "@/lib/users-data";

const STATUS_VARIANT: Record<string, "default" | "outline"> = {
  Aktif: "default",
  "Non-Aktif": "outline",
};

const ROLE_VARIANT: Record<string, "tertiary" | "secondary"> = {
  ADMIN: "tertiary",
  PETUGAS: "secondary",
};

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-2 border-b border-outline-variant/50 last:border-0">
      <span className="font-label-md text-label-md text-on-surface-variant">{label}</span>
      <span className="font-label-md text-label-md text-on-surface text-right">{value}</span>
    </div>
  );
}

export function UsersTable() {
  const toast = useToast();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [detail, setDetail] = useState<UserRow | null>(null);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<UserRow | null>(null);
  const [deletingLoading, setDeletingLoading] = useState(false);

  const load = useCallback(() => {
    let active = true;
    api
      .get("/users")
      .then((res) => active && setUsers(res.data ?? []))
      .catch(
        (err) =>
          active && toast.gagal("Gagal memuat daftar akun", apiError(err)),
      )
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [toast]);

  useEffect(() => load(), [load]);

  function handleEdit(values: UserRow) {
    if (!editing) return;
    setUsers((prev) =>
      prev.map((u) => (u.id === editing.id ? { ...u, ...values } : u)),
    );
    setEditing(null);
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeletingLoading(true);
    try {
      await api.delete(`/users/${deleting.id}`);
      setUsers((prev) => prev.filter((x) => x.id !== deleting.id));
      toast.sukses("Akun dihapus");
      setDeleting(null);
    } catch (err) {
      toast.gagal("Gagal menghapus", apiError(err));
    } finally {
      setDeletingLoading(false);
    }
  }

  const columns: Column<UserRow>[] = [
    {
      id: "profil",
      header: "Profil",
      cell: (u) => (
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center font-label-md text-label-md border border-outline-variant ${initialsClassOf(
            users.indexOf(u),
          )}`}
        >
          {initialsOf(u.nama)}
        </div>
      ),
    },
    {
      id: "nama",
      header: "Nama",
      cell: (u) => <p className="font-medium text-on-surface">{u.nama}</p>,
    },
    {
      id: "email",
      header: "Email",
      cell: (u) => (
        <p className="font-label-md text-label-md text-on-surface-variant">{u.email}</p>
      ),
    },
    {
      id: "role",
      header: "Role",
      cell: (u) => <Badge variant={ROLE_VARIANT[u.role] ?? "outline"}>{u.role}</Badge>,
    },
    {
      id: "bankSampah",
      header: "Bank Sampah",
      cell: (u) => (
        <p className="text-on-surface">{u.bankSampah?.nama ?? "—"}</p>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: (u) => (
        <Badge variant={STATUS_VARIANT[u.isActive ? "Aktif" : "Non-Aktif"]}>
          {u.isActive ? "Aktif" : "Non-Aktif"}
        </Badge>
      ),
    },
  ];

  return (
    <>
      <DataTable
        data={users}
        columns={columns}
        getRowId={(u) => u.id}
        searchKeys={["nama", "email"]}
        searchPlaceholder="Cari Nama atau Email..."
        loading={loading}
        filters={[
          {
            id: "role",
            placeholder: "Semua Role",
            options: ROLE_OPTIONS,
            matches: (u, value) => u.role === value,
          },
          {
            id: "status",
            placeholder: "Semua Status",
            options: STATUS_OPTIONS,
            matches: (u, value) => String(u.isActive) === value,
          },
        ]}
        pageSize={10}
        toolbarActions={
          <Button onClick={() => setAdding(true)} className="h-10 px-4 font-semibold">
            <Plus className="size-4" aria-hidden />
            <span className="hidden sm:inline">Tambah User</span>
          </Button>
        }
        actions={(u) => [
          viewAction(() => setDetail(u)),
          editAction(() => setEditing(u)),
          deleteAction(() => setDeleting(u)),
        ]}
        emptyState={
          <p className="text-center text-on-surface-variant">
            Tidak ada user ditemukan.
          </p>
        }
      />

      {editing && (
        <UsersEditModal
          user={editing}
          open
          onOpenChange={(open) => {
            if (!open) setEditing(null);
          }}
          onSubmit={handleEdit}
        />
      )}

      {adding && (
        <UsersAddModal
          open
          onOpenChange={(open) => {
            if (!open) setAdding(false);
          }}
          onSubmit={() => {
            setAdding(false);
            load();
          }}
        />
      )}

      <Modal
        title="Detail User"
        open={!!detail}
        onOpenChange={(open) => {
          if (!open) setDetail(null);
        }}
        size="sm"
      >
        {detail && (
          <div className="space-y-1">
            <DetailRow label="Nama" value={detail.nama} />
            <DetailRow label="Email" value={detail.email} />
            <DetailRow label="Role" value={detail.role} />
            <DetailRow
              label="Bank Sampah"
              value={detail.bankSampah?.nama ?? "—"}
            />
            <DetailRow
              label="Status"
              value={detail.isActive ? "Aktif" : "Non-Aktif"}
            />
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title="Hapus User"
        description={
          deleting
            ? `Apakah Anda yakin ingin menghapus user "${deleting.nama}" (${deleting.email})?`
            : undefined
        }
        loading={deletingLoading}
        onConfirm={confirmDelete}
      />
    </>
  );
}
