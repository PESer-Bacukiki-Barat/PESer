"use client";

import { Modal } from "@/components/ui/modal";
import { JenisSampahForm } from "@/components/admin/jenis-sampah-form";

export function TambahJenisSampahModal({
  open,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: (values: import("@/lib/jenis-sampah-data").JenisSampah) => void;
}) {
  return (
    <Modal
      title="Tambah Jenis Sampah"
      description="Masukkan informasi detail untuk menambahkan jenis sampah baru ke dalam sistem."
      open={open}
      onOpenChange={onOpenChange}
      size="lg"
    >
      <JenisSampahForm
        bare
        mode="create"
        submitLabel="Simpan"
        cancelLabel="Batal"
        onCancel={() => onOpenChange(false)}
        onSaved={(values) => {
          onSaved?.(values);
          onOpenChange(false);
        }}
      />
    </Modal>
  );
}
