"use client";

import { Modal } from "@/components/ui/modal";
import { NasabahForm } from "@/components/admin/nasabah-form";
import type { Nasabah } from "@/lib/nasabah-data";

export function EditNasabahModal({
  nasabah,
  open,
  onOpenChange,
}: {
  nasabah: Nasabah;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Modal
      title="Edit Nasabah"
      description={`Perbarui informasi nasabah ${nasabah.nama} (${nasabah.id}).`}
      open={open}
      onOpenChange={onOpenChange}
      size="md"
    >
      <NasabahForm
        bare
        initialData={nasabah}
        submitLabel="Simpan Perubahan"
        cancelLabel="Batal"
        onSubmit={() => onOpenChange(false)}
        onCancel={() => onOpenChange(false)}
      />
    </Modal>
  );
}