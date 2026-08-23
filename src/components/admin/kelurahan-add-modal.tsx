"use client";

import { Modal } from "@/components/ui/modal";
import { KelurahanForm } from "@/components/admin/kelurahan-form";

export function AddKelurahanModal({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: { nama: string; kodeWilayah: string }) => void;
}) {
  return (
    <Modal
      title="Tambah Kelurahan"
      description="Masukkan informasi kelurahan baru yang akan didaftarkan ke dalam sistem."
      open={open}
      onOpenChange={onOpenChange}
      size="md"
    >
      <KelurahanForm
        bare
        mode="create"
        submitLabel="Simpan"
        cancelLabel="Batal"
        onSubmit={onSubmit}
        onCancel={() => onOpenChange(false)}
      />
    </Modal>
  );
}
