"use client";

import { Modal } from "@/components/ui/modal";
import { PembeliForm } from "@/components/admin/pembeli-form";
import type { Pembeli } from "@/lib/pembeli-data";

export function EditPembeliModal({
  pembeli,
  open,
  onOpenChange,
}: {
  pembeli: Pembeli;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Modal
      title="Edit Pembeli"
      description={`Perbarui informasi pembeli ${pembeli.nama}.`}
      open={open}
      onOpenChange={onOpenChange}
      size="md"
    >
      <PembeliForm
        bare
        mode="edit"
        id={pembeli.id}
        initialData={pembeli}
        submitLabel="Simpan Perubahan"
        cancelLabel="Batal"
        onSaved={() => onOpenChange(false)}
        onCancel={() => onOpenChange(false)}
      />
    </Modal>
  );
}
