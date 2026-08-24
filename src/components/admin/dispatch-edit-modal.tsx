"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { Modal } from "@/components/ui/modal"
import { DispatchForm } from "@/components/admin/dispatch-form"
import { api, apiError } from "@/lib/api"
import type {
  Dispatch,
  DispatchFormOptions,
  DispatchFormValues,
} from "@/lib/dispatch-data"

/**
 * Revisi isi dispatch — PUT /api/dispatch/:id.
 *
 * Sebelumnya tombol "Simpan Perubahan" di sini hanya menutup modal tanpa
 * memanggil API sama sekali, jadi pengguna mengira datanya tersimpan padahal
 * tidak. Sekarang benar-benar menyimpan.
 *
 * Modal ini hanya boleh dibuka untuk status di BOLEH_REVISI (dijaga di
 * dispatch-table dan ditegakkan ulang oleh API). Perubahan STATUS tidak lewat
 * sini — itu urusan endpoint aksi/state machine.
 */
export function EditDispatchModal({
  dispatch,
  options,
  open,
  onOpenChange,
}: {
  dispatch: Dispatch
  options: DispatchFormOptions
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const [menyimpan, setMenyimpan] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function simpan(values: DispatchFormValues) {
    setMenyimpan(true)
    setError(null)
    try {
      await api.put(`/dispatch/${dispatch.id}`, {
        // kodeDispatch tidak disunting di form, tapi skema API memintanya.
        kodeDispatch: dispatch.kodeDispatch,
        bankSampahId: values.bankSampahId,
        pembeliId: values.pembeliId,
        tanggalJemput: new Date(values.tanggalJemput).toISOString(),
        items: values.items.map((i) => ({
          jenisSampahId: i.jenisSampahId,
          beratTarget: parseFloat(i.beratTarget),
          hargaJualPerKg: parseFloat(i.hargaJualPerKg),
        })),
      })
      onOpenChange(false)
      router.refresh()
    } catch (e) {
      setError(apiError(e))
    } finally {
      setMenyimpan(false)
    }
  }

  return (
    <Modal
      title="Edit Dispatch"
      description={`Perbarui isi dispatch ${dispatch.kodeDispatch}.`}
      open={open}
      onOpenChange={onOpenChange}
      size="lg"
    >
      {error && (
        <p role="alert" className="mb-4 font-label-md text-label-md text-error">
          {error}
        </p>
      )}
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
        submitLabel={menyimpan ? "Menyimpan..." : "Simpan Perubahan"}
        cancelLabel="Batal"
        onSubmit={simpan}
        onCancel={() => onOpenChange(false)}
      />
    </Modal>
  )
}
