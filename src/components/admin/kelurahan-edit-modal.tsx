"use client";

import { Modal } from "@/components/ui/modal";
import { KelurahanForm } from "@/components/admin/kelurahan-form";
import type { Kelurahan } from "@/lib/kelurahan-data";

export function EditKelurahanModal({
  kelurahan,
  open,
  onOpenChange,
}: {
  kelurahan: Kelurahan;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Modal
      title="Edit Kelurahan"
      description={`Perbarui informasi kelurahan ${kelurahan.name} (${kelurahan.id}).`}
      open={open}
      onOpenChange={onOpenChange}
      size="md"
    >
      <KelurahanForm
        bare
        initialData={kelurahan}
        submitLabel="Simpan Perubahan"
        cancelLabel="Batal"
        onSubmit={() => onOpenChange(false)}
        onCancel={() => onOpenChange(false)}
      />
    </Modal>
  );
}