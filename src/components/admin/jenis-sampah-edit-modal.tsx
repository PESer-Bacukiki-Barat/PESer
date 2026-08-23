"use client";

import { Modal } from "@/components/ui/modal";
import { JenisSampahForm } from "@/components/admin/jenis-sampah-form";
import type { JenisSampah } from "@/lib/jenis-sampah-data";

export function EditJenisSampahModal({
  jenisSampah,
  open,
  onOpenChange,
  onSaved,
}: {
  jenisSampah: JenisSampah;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: (values: JenisSampah) => void;
}) {
  return (
    <Modal
      title="Edit Jenis Sampah"
      description={`Perbarui informasi jenis sampah ${jenisSampah.nama} (${jenisSampah.kode}).`}
      open={open}
      onOpenChange={onOpenChange}
      size="md"
    >
      <JenisSampahForm
        bare
        id={jenisSampah.id}
        mode="edit"
        initialData={jenisSampah}
        submitLabel="Simpan Perubahan"
        cancelLabel="Batal"
        onCancel={() => onOpenChange(false)}
        onSaved={onSaved}
      />
    </Modal>
  );
}
