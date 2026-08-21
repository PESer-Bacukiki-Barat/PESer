"use client";

import { Modal } from "@/components/ui/modal";
import { BankSampahForm } from "@/components/admin/bank-sampah-form";
import type { BankSampah, BankSampahPayload } from "@/lib/bank-sampah-data";
import type { SelectOption } from "@/components/admin/form-fields";

export function EditBankSampahModal({
  bankSampah,
  kelurahanOptions,
  open,
  onOpenChange,
  onSubmit,
}: {
  bankSampah: BankSampah;
  kelurahanOptions: SelectOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: BankSampahPayload) => void;
}) {
  return (
    <Modal
      title="Edit Bank Sampah"
      description={`Perbarui informasi bank sampah ${bankSampah.nama} (${bankSampah.kelurahanId}).`}
      open={open}
      onOpenChange={onOpenChange}
      size="md"
    >
      <BankSampahForm
        bare
        mode="edit"
        id={bankSampah.id}
        kelurahanOptions={kelurahanOptions}
        initialData={bankSampah}
        submitLabel="Simpan Perubahan"
        cancelLabel="Batal"
        onSubmit={onSubmit}
        onCancel={() => onOpenChange(false)}
      />
    </Modal>
  );
}
