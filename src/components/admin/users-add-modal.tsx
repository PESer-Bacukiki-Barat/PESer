"use client";

import { Modal } from "@/components/ui/modal";
import { UsersForm } from "@/components/admin/users-form";

export function UsersAddModal({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
}) {
  return (
    <Modal
      title="Tambah User"
      description="Daftarkan akun user baru (admin atau petugas) ke dalam sistem."
      open={open}
      onOpenChange={onOpenChange}
      size="md"
    >
      <UsersForm
        bare
        mode="create"
        submitLabel="Simpan"
        cancelLabel="Batal"
        onSubmit={() => onSubmit()}
        onCancel={() => onOpenChange(false)}
      />
    </Modal>
  );
}
