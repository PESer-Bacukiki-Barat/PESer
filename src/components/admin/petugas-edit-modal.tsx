"use client";

import { Modal } from "@/components/ui/modal";
import { PetugasForm } from "@/components/admin/petugas-form";
import type { Petugas } from "@/lib/petugas-data";

export function EditPetugasModal({
  petugas,
  open,
  onOpenChange,
}: {
  petugas: Petugas;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Modal
      title="Edit Petugas"
      description={`Perbarui informasi petugas ${petugas.nama} (${petugas.nip}).`}
      open={open}
      onOpenChange={onOpenChange}
      size="md"
    >
      <PetugasForm
        bare
        initialData={{
          nama: petugas.nama,
          nip: petugas.nip,
          noHp: petugas.noHp,
          email: petugas.email,
          kelurahan: petugas.unitKerja,
          status: petugas.status,
          alamat: petugas.alamat,
          foto: petugas.foto,
        }}
        submitLabel="Simpan Perubahan"
        cancelLabel="Batal"
        onSubmit={() => onOpenChange(false)}
        onCancel={() => onOpenChange(false)}
      />
    </Modal>
  );
}