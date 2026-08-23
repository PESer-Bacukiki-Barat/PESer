"use client";

import { Modal } from "@/components/ui/modal";
import { NasabahForm } from "@/components/admin/nasabah-form";
import type { Nasabah } from "@/lib/nasabah-data";
import type { SelectOption } from "@/components/admin/form-fields";

export function EditNasabahModal({
  nasabah,
  bankSampahOptions,
  open,
  onOpenChange,
}: {
  nasabah: Nasabah;
  bankSampahOptions: SelectOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Modal
      title="Edit Nasabah"
      description={`Perbarui informasi nasabah ${nasabah.nama} (${nasabah.kodeNasabah}).`}
      open={open}
      onOpenChange={onOpenChange}
      size="md"
    >
      <NasabahForm
        bare
        mode="edit"
        id={nasabah.id}
        initialData={nasabah}
        bankSampahOptions={bankSampahOptions}
        submitLabel="Simpan Perubahan"
        cancelLabel="Batal"
        onSaved={() => onOpenChange(false)}
        onCancel={() => onOpenChange(false)}
      />
    </Modal>
  );
}
