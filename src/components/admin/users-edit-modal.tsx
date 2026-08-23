"use client";

import { Modal } from "@/components/ui/modal";
import { UsersForm } from "@/components/admin/users-form";
import type { UserRow } from "@/lib/users-data";

export function UsersEditModal({
  user,
  open,
  onOpenChange,
  onSubmit,
}: {
  user: UserRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: UserRow) => void;
}) {
  return (
    <Modal
      title="Edit User"
      description={`Perbarui informasi user ${user.nama} (${user.email}).`}
      open={open}
      onOpenChange={onOpenChange}
      size="md"
    >
      <UsersForm
        bare
        mode="edit"
        id={user.id}
        initialData={user}
        submitLabel="Simpan Perubahan"
        cancelLabel="Batal"
        onSubmit={(values) => onSubmit({ ...user, ...values })}
        onCancel={() => onOpenChange(false)}
      />
    </Modal>
  );
}
