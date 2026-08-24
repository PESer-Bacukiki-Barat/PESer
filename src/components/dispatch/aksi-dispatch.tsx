"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Field, inputClass } from "@/components/admin/form-fields"
import { api, apiError, apiFieldErrors } from "@/lib/api"
import { TOLERANSI_SELISIH } from "@/lib/constants"
import type { AksiDispatch } from "@/lib/dispatch-aksi"

export type ItemAksi = {
  id: string
  jenisSampah: string
  beratTarget: number
  beratAktual: number | null
}

const gayaTombol: Record<AksiDispatch["gaya"], "default" | "outline" | "destructive"> = {
  utama: "default",
  netral: "outline",
  bahaya: "destructive",
}

const fmt = (n: number) =>
  new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(n)

/**
 * Panel aksi dispatch.
 *
 * Daftar `aksi` dihitung di server dari tabel §8.2 lewat aksiTersedia(), jadi
 * komponen ini tidak menyimpan aturan transisi apa pun — ia hanya menampilkan
 * apa yang boleh, dan mengumpulkan masukan yang diminta tiap aksi. Kalau tabel
 * §8.2 berubah, UI ikut tanpa disunting.
 */
export function AksiDispatchPanel({
  dispatchId,
  items,
  aksi,
  totalNilaiSaatIni,
}: {
  dispatchId: string
  items: ItemAksi[]
  aksi: AksiDispatch[]
  totalNilaiSaatIni: number | null
}) {
  const router = useRouter()
  const [terpilih, setTerpilih] = useState<AksiDispatch | null>(null)
  const [mengirim, setMengirim] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldError, setFieldError] = useState<Record<string, string>>({})

  const [alasan, setAlasan] = useState("")
  const [nilai, setNilai] = useState("")
  const [berat, setBerat] = useState<Record<string, string>>({})
  const [alasanSelisih, setAlasanSelisih] = useState("")

  function buka(a: AksiDispatch) {
    setTerpilih(a)
    setError(null)
    setFieldError({})
    setAlasan("")
    setAlasanSelisih("")
    setNilai(totalNilaiSaatIni ? String(totalNilaiSaatIni) : "")
    setBerat(
      Object.fromEntries(
        items.map((i) => [i.id, i.beratAktual != null ? String(i.beratAktual) : ""]),
      ),
    )
  }

  function tutup() {
    if (mengirim) return
    setTerpilih(null)
  }

  /** Item yang selisihnya melewati toleransi — dipakai untuk peringatan dini. */
  const selisihSignifikan = useMemo(() => {
    return items.filter((i) => {
      const nilaiBerat = Number(berat[i.id])
      if (!nilaiBerat || i.beratTarget <= 0) return false
      return Math.abs(nilaiBerat - i.beratTarget) / i.beratTarget > TOLERANSI_SELISIH
    })
  }, [items, berat])

  async function kirim() {
    if (!terpilih) return
    setMengirim(true)
    setError(null)
    setFieldError({})

    const body: Record<string, unknown> = {}
    if (terpilih.perlu === "alasan") body.alasanTolak = alasan
    if (terpilih.perlu === "nilai" && nilai) body.totalNilai = Number(nilai)
    if (terpilih.perlu === "berat-aktual") {
      body.beratAktual = items.map((i) => ({
        dispatchItemId: i.id,
        beratAktual: Number(berat[i.id]),
      }))
      if (alasanSelisih.trim()) body.alasanSelisih = alasanSelisih.trim()
    }

    try {
      await api.post(`/dispatch/${dispatchId}/${terpilih.slug}`, body)
      setTerpilih(null)
      router.refresh()
    } catch (e) {
      const fe = apiFieldErrors(e)
      if (fe) setFieldError(fe)
      setError(apiError(e))
    } finally {
      setMengirim(false)
    }
  }

  if (aksi.length === 0) {
    return (
      <p className="font-body-md text-body-md text-on-surface-variant">
        Tidak ada aksi yang tersedia untuk Anda pada status ini.
      </p>
    )
  }

  const butuhForm = terpilih?.perlu != null

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {aksi.map((a) => (
          <Button
            key={a.ke}
            type="button"
            variant={gayaTombol[a.gaya]}
            onClick={() => buka(a)}
            disabled={mengirim}
          >
            {a.label}
          </Button>
        ))}
      </div>

      {/* Aksi tanpa masukan tambahan: cukup konfirmasi. */}
      <ConfirmDialog
        open={!!terpilih && !butuhForm}
        onOpenChange={(o) => !o && tutup()}
        title={terpilih?.label}
        description={
          <>
            {terpilih?.keterangan}
            {error && <span className="block mt-2 text-error">{error}</span>}
          </>
        }
        confirmLabel={terpilih?.label}
        loading={mengirim}
        onConfirm={kirim}
      />

      {/* Aksi yang butuh masukan. */}
      <Modal
        open={!!terpilih && butuhForm}
        onOpenChange={(o) => !o && tutup()}
        title={terpilih?.label}
        description={terpilih?.keterangan}
        size={terpilih?.perlu === "berat-aktual" ? "lg" : "md"}
      >
        <div className="space-y-4">
          {terpilih?.perlu === "alasan" && (
            <Field label="Alasan penolakan" htmlFor="alasan" error={fieldError.alasanTolak}>
              <textarea
                id="alasan"
                rows={3}
                value={alasan}
                onChange={(e) => setAlasan(e.target.value)}
                className={inputClass(!!fieldError.alasanTolak)}
                placeholder="Contoh: jenis sampah tidak sesuai surat jalan"
              />
            </Field>
          )}

          {terpilih?.perlu === "nilai" && (
            <Field
              label="Nilai penjualan (Rp)"
              htmlFor="nilai"
              error={fieldError.totalNilai}
              hint="Terisi otomatis dari serah terima. Ubah bila nilai final berbeda."
            >
              <input
                id="nilai"
                type="number"
                min={0}
                step={1}
                value={nilai}
                onChange={(e) => setNilai(e.target.value)}
                className={inputClass(!!fieldError.totalNilai)}
              />
            </Field>
          )}

          {terpilih?.perlu === "berat-aktual" && (
            <>
              <div className="rounded-lg border border-outline-variant overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-surface-container-high">
                    <tr>
                      <th className="px-3 py-2 font-label-sm text-label-sm text-on-surface-variant">
                        Jenis Sampah
                      </th>
                      <th className="px-3 py-2 font-label-sm text-label-sm text-on-surface-variant text-right">
                        Target
                      </th>
                      <th className="px-3 py-2 font-label-sm text-label-sm text-on-surface-variant text-right">
                        Berat Aktual (kg)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant">
                    {items.map((i) => (
                      <tr key={i.id}>
                        <td className="px-3 py-2 font-body-md text-body-md text-on-surface">
                          {i.jenisSampah}
                        </td>
                        <td className="px-3 py-2 font-mono text-body-md text-on-surface-variant text-right">
                          {fmt(i.beratTarget)}
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            required
                            aria-label={`Berat aktual ${i.jenisSampah}`}
                            value={berat[i.id] ?? ""}
                            onChange={(e) =>
                              setBerat((p) => ({ ...p, [i.id]: e.target.value }))
                            }
                            className={`${inputClass(!!fieldError.beratAktual)} text-right`}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {fieldError.beratAktual && (
                <p className="font-label-sm text-label-sm text-error">
                  {fieldError.beratAktual}
                </p>
              )}

              {selisihSignifikan.length > 0 && (
                <div className="flex gap-2 rounded-lg border border-tertiary bg-tertiary-container/40 p-3">
                  <AlertTriangle
                    className="size-4 shrink-0 mt-0.5 text-on-tertiary-container"
                    aria-hidden
                  />
                  <div className="min-w-0">
                    <p className="font-label-md text-label-md text-on-tertiary-container">
                      Selisih melebihi {TOLERANSI_SELISIH * 100}% pada{" "}
                      {selisihSignifikan.map((i) => i.jenisSampah).join(", ")}
                    </p>
                    <p className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">
                      Alasan wajib diisi dan dispatch ditandai untuk direview admin.
                    </p>
                  </div>
                </div>
              )}

              <Field
                label="Alasan selisih"
                htmlFor="alasan-selisih"
                error={fieldError.alasanSelisih}
                hint={
                  selisihSignifikan.length > 0
                    ? undefined
                    : "Opsional selama selisih masih dalam toleransi."
                }
              >
                <textarea
                  id="alasan-selisih"
                  rows={2}
                  value={alasanSelisih}
                  onChange={(e) => setAlasanSelisih(e.target.value)}
                  className={inputClass(!!fieldError.alasanSelisih)}
                  placeholder="Contoh: sebagian basah, ditimbang ulang di lokasi pembeli"
                />
              </Field>
            </>
          )}

          {error && (
            <p role="alert" className="font-label-md text-label-md text-error">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={tutup} disabled={mengirim}>
              Batal
            </Button>
            <Button type="button" onClick={kirim} disabled={mengirim}>
              {mengirim ? "Menyimpan..." : terpilih?.label}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
