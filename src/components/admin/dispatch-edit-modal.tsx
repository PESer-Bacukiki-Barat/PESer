"use client";

import { Modal } from "@/components/ui/modal";
import { DispatchForm } from "@/components/admin/dispatch-form";
import type { Dispatch, DispatchFormOptions } from "@/lib/dispatch-data";

export function EditDispatchModal({
  dispatch,
  options,
  open,
  onOpenChange,
}: {
  dispatch: Dispatch;
  options: DispatchFormOptions;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Modal
      title="Edit Dispatch"
      description={`Perbarui informasi dispatch ${dispatch.kodeDispatch}.`}
      open={open}
      onOpenChange={onOpenChange}
      size="lg"
    >
      <DispatchForm
        bare
        bankSampahOptions={options.bankSampah}
        pembeliOptions={options.pembeli}
        jenisSampahOptions={options.jenisSampah}
        initialData={{
          bankSampahId: dispatch.bankSampahId,
          pembeliId: dispatch.pembeliId,
          tanggalJemput: dispatch.tanggalJemput
            ? new Date(dispatch.tanggalJemput).toISOString().slice(0, 16)
            : "",
          items: dispatch.items.map((i) => ({
            jenisSampahId: i.jenisSampahId,
            beratTarget: String(i.beratTarget),
            hargaJualPerKg: String(i.hargaJualPerKg),
          })),
          alasan: dispatch.alasanTolak ?? dispatch.alasanSelisih ?? "",
        }}
        submitLabel="Simpan Perubahan"
        cancelLabel="Batal"
        onSubmit={() => onOpenChange(false)}
        onCancel={() => onOpenChange(false)}
      />
    </Modal>
  );
}
