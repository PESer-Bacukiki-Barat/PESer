"use client";

import { Modal } from "@/components/ui/modal";
import { JenisSampahForm } from "@/components/admin/jenis-sampah-form";
import type { JenisSampah } from "@/lib/jenis-sampah-data";

export function EditJenisSampahModal({
  jenisSampah,
  open,
  onOpenChange,
}: {
  jenisSampah: JenisSampah;
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
        initialData={jenisSampah}
        submitLabel="Simpan Perubahan"
        cancelLabel="Batal"
        onSubmit={() => onOpenChange(false)}
        onCancel={() => onOpenChange(false)}
      />
    </Modal>
  );
}