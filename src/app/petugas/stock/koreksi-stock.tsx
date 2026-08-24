"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { PencilLine } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { Field, inputClass } from "@/components/admin/form-fields"
import { api, apiError, apiFieldErrors } from "@/lib/api"

const fmt = (n: number) =>
  new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(n)

/**
 * Koreksi stock — FR-C7 "ubah langsung, tanpa approval" (PETUGAS).
 *
 * Batas bawahnya bukan nol tapi beratReservasi: menurunkan stock di bawah
 * jumlah yang sudah dijanjikan ke dispatch berjalan akan membuat stock
 * tersedia negatif (BR-12). Server menolaknya, dan di sini batasnya
 * ditampilkan lebih dulu supaya petugas tidak menebak-nebak.
 */
export function KoreksiStock({
  stockId,
  jenisSampah,
  beratSekarang,
  beratReservasi,
}: {
  stockId: string
  jenisSampah: string
  beratSekarang: number
  beratReservasi: number
}) {
  const router = useRouter()
  const [buka, setBuka] = useState(false)
  const [beratBaru, setBeratBaru] = useState("")
  const [alasan, setAlasan] = useState("")
  const [menyimpan, setMenyimpan] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldError, setFieldError] = useState<Record<string, string>>({})

  function mulai() {
    setBeratBaru(String(beratSekarang))
    setAlasan("")
    setError(null)
    setFieldError({})
    setBuka(true)
  }

  const nilaiBaru = Number(beratBaru)
  const selisih = Number.isFinite(nilaiBaru) ? nilaiBaru - beratSekarang : 0
  const dibawahReservasi = Number.isFinite(nilaiBaru) && nilaiBaru < beratReservasi
  const bisaSimpan =
    beratBaru !== "" &&
    Number.isFinite(nilaiBaru) &&
    nilaiBaru >= 0 &&
    !dibawahReservasi &&
    selisih !== 0 &&
    alasan.trim().length > 0 &&
    !menyimpan

  async function simpan() {
    setMenyimpan(true)
    setError(null)
    setFieldError({})
    try {
      await api.post("/koreksi-stock", {
        stockId,
        beratBaru: nilaiBaru,
        alasan: alasan.trim(),
      })
      setBuka(false)
      router.refresh()
    } catch (e) {
      const fe = apiFieldErrors(e)
      if (fe) setFieldError(fe)
      setError(apiError(e))
    } finally {
      setMenyimpan(false)
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={mulai}
        aria-label={`Koreksi stock ${jenisSampah}`}
      >
        <PencilLine aria-hidden /> Koreksi
      </Button>

      <Modal
        open={buka}
        onOpenChange={(o) => {
          if (!menyimpan) setBuka(o)
        }}
        title={`Koreksi ${jenisSampah}`}
        description="Koreksi berlaku langsung tanpa persetujuan, tapi tercatat di riwayat beserta alasannya."
      >
        <div className="space-y-4">
          <dl className="rounded-lg border border-outline-variant p-3 space-y-1">
            <div className="flex items-baseline justify-between">
              <dt className="font-label-sm text-label-sm text-on-surface-variant">
                Tercatat sekarang
              </dt>
              <dd className="font-label-md text-label-md font-mono text-on-surface">
                {fmt(beratSekarang)} kg
              </dd>
            </div>
            {beratReservasi > 0 && (
              <div className="flex items-baseline justify-between">
                <dt className="font-label-sm text-label-sm text-on-surface-variant">
                  Ditahan dispatch
                </dt>
                <dd className="font-label-md text-label-md font-mono text-on-surface-variant">
                  {fmt(beratReservasi)} kg
                </dd>
              </div>
            )}
          </dl>

          <Field
            label="Berat hasil timbang ulang (kg)"
            htmlFor="berat-baru"
            error={fieldError.beratBaru}
            required
            hint={
              beratReservasi > 0
                ? `Tidak boleh di bawah ${fmt(beratReservasi)} kg karena sedang ditahan dispatch.`
                : undefined
            }
          >
            <input
              id="berat-baru"
              type="number"
              min={beratReservasi}
              step="0.01"
              inputMode="decimal"
              value={beratBaru}
              onChange={(e) => setBeratBaru(e.target.value)}
              className={`${inputClass(!!fieldError.beratBaru || dibawahReservasi)} text-right`}
            />
          </Field>

          {dibawahReservasi && (
            <p className="font-label-sm text-label-sm text-error">
              {fmt(beratReservasi)} kg sedang direservasi dispatch — koreksi tidak boleh
              di bawah itu.
            </p>
          )}

          {selisih !== 0 && !dibawahReservasi && (
            <p aria-live="polite" className="font-label-md text-label-md text-on-surface">
              Perubahan:{" "}
              <span
                className={`font-mono ${selisih > 0 ? "text-primary" : "text-error"}`}
              >
                {selisih > 0 ? "+" : ""}
                {fmt(selisih)} kg
              </span>
            </p>
          )}

          <Field label="Alasan koreksi" htmlFor="alasan-koreksi" error={fieldError.alasan} required>
            <textarea
              id="alasan-koreksi"
              rows={3}
              value={alasan}
              onChange={(e) => setAlasan(e.target.value)}
              className={inputClass(!!fieldError.alasan)}
              placeholder="Contoh: timbang ulang setelah dikeringkan, susut karena air"
            />
          </Field>

          {error && (
            <p role="alert" className="font-label-md text-label-md text-error">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => setBuka(false)}
              disabled={menyimpan}
            >
              Batal
            </Button>
            <Button type="button" onClick={simpan} disabled={!bisaSimpan}>
              {menyimpan ? "Menyimpan..." : "Simpan Koreksi"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
