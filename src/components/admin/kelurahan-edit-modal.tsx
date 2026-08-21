"use client";

import { Modal } from "@/components/ui/modal";
import { KelurahanForm } from "@/components/admin/kelurahan-form";
import type { Kelurahan } from "@/lib/kelurahan-data";

export function EditKelurahanModal({
  kelurahan,
  open,
  onOpenChange,
  onSubmit,
}: {
  kelurahan: Kelurahan;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: { nama: string; kodeWilayah: string }) => void;
}) {
  return (
    <Modal
      title="Edit Kelurahan"
      description={`Perbarui informasi kelurahan ${kelurahan.nama} (${kelurahan.kodeWilayah}).`}
      open={open}
      onOpenChange={onOpenChange}
      size="md"
    >
      <KelurahanForm
        bare
        mode="edit"
        id={kelurahan.id}
        initialData={kelurahan}
        submitLabel="Simpan Perubahan"
        cancelLabel="Batal"
        onSubmit={onSubmit}
        onCancel={() => onOpenChange(false)}
      />
    </Modal>
  );
}
