"use client";

import { Modal } from "@/components/ui/modal";
import { BankSampahForm } from "@/components/admin/bank-sampah-form";
import type { BankSampah } from "@/lib/bank-sampah-data";

export function EditBankSampahModal({
  bankSampah,
  open,
  onOpenChange,
}: {
  bankSampah: BankSampah;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Modal
      title="Edit Bank Sampah"
      description={`Perbarui informasi bank sampah ${bankSampah.nama} (${bankSampah.id}).`}
      open={open}
      onOpenChange={onOpenChange}
      size="md"
    >
      <BankSampahForm
        bare
        initialData={bankSampah}
        initialStock={bankSampah.stock}
        submitLabel="Simpan Perubahan"
        cancelLabel="Batal"
        onSubmit={() => onOpenChange(false)}
        onCancel={() => onOpenChange(false)}
      />
    </Modal>
  );
}