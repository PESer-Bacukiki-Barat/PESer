"use client"

import { useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { CloudOff, Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Field, inputClass } from "@/components/admin/form-fields"
import { api, apiError, apiFieldErrors, apiStatus } from "@/lib/api"
import { useAntrean } from "@/components/petugas/antrean-provider"
import { KONDISI_SAMPAH_OPTIONS, type KondisiSampah } from "@/lib/setoran-data"

export type NasabahOpsi = { id: string; kodeNasabah: string; nama: string }
export type JenisOpsi = { id: string; nama: string; harga: number }

type Baris = { jenisSampahId: string; berat: string; kondisi: KondisiSampah }

const barisBaru = (): Baris => ({ jenisSampahId: "", berat: "", kondisi: "BERSIH" })

const fmtRupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n)

const fmtBerat = (n: number) =>
  new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(n)

/**
 * Form setoran — FR-C1..C4, alur PRD §4.1.
 *
 * Kalkulasi di layar ini hanya untuk diperlihatkan ke petugas dan warga;
 * angka yang tersimpan tetap dihitung server dari JenisSampah.harga (BR-09),
 * jadi harga tidak pernah dikirim dari klien.
 *
 * Idempotency-Key dibuat sekali per pengisian form dan dipakai ulang kalau
 * pengiriman gagal — itu yang membuat retry aman tanpa duplikat (§6.1).
 * Setelah berhasil, halaman berpindah ke bukti setor sehingga komponen ini
 * di-unmount; pengisian berikutnya otomatis memakai kunci baru.
 */
export function SetorForm({
  nasabah,
  jenis,
}: {
  nasabah: NasabahOpsi[]
  jenis: JenisOpsi[]
}) {
  const router = useRouter()
  const { antrekan, online } = useAntrean()

  const [nasabahId, setNasabahId] = useState("")
  const [cari, setCari] = useState("")
  const [baris, setBaris] = useState<Baris[]>([barisBaru()])
  const [cashDibayar, setCashDibayar] = useState(true)
  const [mengirim, setMengirim] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldError, setFieldError] = useState<Record<string, string>>({})
  const [diantrekan, setDiantrekan] = useState(false)

  /**
   * Kunci idempotensi disimpan di ref, bukan state: ia tidak memengaruhi
   * tampilan, dan dibuat saat pengiriman pertama lalu DIPAKAI ULANG kalau
   * gagal — itu yang membuat retry aman tanpa duplikat (§6.1). Membuatnya
   * di useEffect akan memicu render ekstra, dan membuatnya saat render akan
   * berbeda antara server dan klien.
   */
  const idempotencyKey = useRef<string | null>(null)

  const hargaById = useMemo(
    () => new Map(jenis.map((j) => [j.id, j.harga])),
    [jenis],
  )

  const nasabahTersaring = useMemo(() => {
    const q = cari.trim().toLowerCase()
    if (!q) return nasabah
    return nasabah.filter(
      (n) =>
        n.nama.toLowerCase().includes(q) || n.kodeNasabah.toLowerCase().includes(q),
    )
  }, [nasabah, cari])

  const rincian = useMemo(
    () =>
      baris.map((b) => {
        const harga = hargaById.get(b.jenisSampahId) ?? 0
        const berat = Number(b.berat) || 0
        return { harga, berat, subtotal: berat * harga }
      }),
    [baris, hargaById],
  )

  const totalBerat = rincian.reduce((a, r) => a + r.berat, 0)
  const totalNilai = rincian.reduce((a, r) => a + r.subtotal, 0)

  const bisaKirim =
    !!nasabahId &&
    baris.length > 0 &&
    baris.every((b) => b.jenisSampahId && Number(b.berat) > 0)

  function ubahBaris(i: number, patch: Partial<Baris>) {
    setBaris((p) => p.map((b, idx) => (idx === i ? { ...b, ...patch } : b)))
  }

  async function kirim() {
    idempotencyKey.current ??= crypto.randomUUID()
    const kunci = idempotencyKey.current
    setMengirim(true)
    setError(null)
    setFieldError({})

    const payload = {
      nasabahId,
      cashDibayar,
      items: baris.map((b) => ({
        jenisSampahId: b.jenisSampahId,
        berat: Number(b.berat),
        kondisi: b.kondisi,
      })),
    }
    const ringkasan = {
      nasabah: nasabah.find((n) => n.id === nasabahId)?.nama ?? "Nasabah",
      totalBerat,
      totalNilai,
    }

    // Sudah tahu offline sebelum mencoba: langsung antrekan, tanpa membuat
    // petugas menunggu permintaan yang pasti gagal (§4.3 "Input setoran wajib
    // offline").
    if (!online) {
      await antrekan(kunci, payload, ringkasan)
      setDiantrekan(true)
      setMengirim(false)
      return
    }

    try {
      const { data } = await api.post<{ id: string }>("/setoran", payload, {
        headers: { "Idempotency-Key": kunci },
      })
      router.push(`/petugas/setoran/${data.id}`)
    } catch (e) {
      const status = apiStatus(e)
      // 4xx berarti isinya yang salah — mengantrekannya hanya menunda
      // kegagalan yang sama, jadi tampilkan supaya bisa diperbaiki sekarang.
      if (status && status >= 400 && status < 500) {
        const fe = apiFieldErrors(e)
        if (fe) setFieldError(fe)
        setError(apiError(e))
        setMengirim(false)
        return
      }
      // Jaringan mati atau server bermasalah: simpan, jangan buang hasil
      // timbangan yang sudah dicatat di depan warga.
      await antrekan(kunci, payload, ringkasan)
      setDiantrekan(true)
      setMengirim(false)
    }
  }

  if (nasabah.length === 0) {
    return (
      <p className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 font-body-md text-body-md text-on-surface-variant">
        Belum ada nasabah aktif di bank sampah ini. Nasabah didaftarkan lebih dulu
        sebelum setoran bisa dicatat.
      </p>
    )
  }

  /** Mulai pengisian baru: kunci idempotensi harus baru juga. */
  function mulaiBaru() {
    idempotencyKey.current = null
    setNasabahId("")
    setCari("")
    setBaris([barisBaru()])
    setCashDibayar(true)
    setDiantrekan(false)
    setError(null)
    setFieldError({})
  }

  if (diantrekan) {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-xl border border-tertiary bg-tertiary-container/40 p-4">
          <CloudOff className="size-5 shrink-0 text-on-tertiary-container" aria-hidden />
          <div className="min-w-0">
            <p className="font-headline-md text-[16px] font-semibold text-on-tertiary-container">
              Tersimpan di antrean
            </p>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1">
              {online
                ? "Server belum bisa dihubungi. Setoran ini akan terkirim otomatis begitu koneksi stabil."
                : "Anda sedang offline. Setoran ini akan terkirim otomatis begitu koneksi pulih."}
            </p>
          </div>
        </div>

        <dl className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4 space-y-1">
          <div className="flex items-baseline justify-between">
            <dt className="font-label-md text-label-md text-on-surface-variant">
              Total berat
            </dt>
            <dd className="font-label-md text-label-md font-mono text-on-surface">
              {fmtBerat(totalBerat)} kg
            </dd>
          </div>
          <div className="flex items-baseline justify-between">
            <dt className="font-label-md text-label-md text-on-surface-variant">
              Total nilai
            </dt>
            <dd className="text-headline-md font-mono font-semibold text-primary">
              {fmtRupiah(totalNilai)}
            </dd>
          </div>
        </dl>

        <p className="font-label-sm text-label-sm text-on-surface-variant">
          Jumlah antrean terlihat di badge pada header. Jangan keluar dari aplikasi
          di perangkat lain — antrean tersimpan di perangkat ini.
        </p>

        <Button type="button" className="w-full h-12" onClick={mulaiBaru}>
          Catat Setoran Berikutnya
        </Button>
      </div>
    )
  }

  if (jenis.length === 0) {
    return (
      <p className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 font-body-md text-body-md text-on-surface-variant">
        Belum ada jenis sampah dengan harga aktif. Jenis sampah berharga 0 tidak
        boleh masuk setoran (BR-16) — minta admin mengisi harganya lebih dulu.
      </p>
    )
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (bisaKirim && !mengirim) kirim()
      }}
      className="space-y-5"
    >
      {/* Nasabah */}
      <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4 space-y-3">
        <h2 className="font-headline-md text-[16px] font-semibold text-on-surface">
          1. Nasabah
        </h2>
        <Field label="Cari nasabah" htmlFor="cari">
          <input
            id="cari"
            type="search"
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            placeholder="Nama atau kode nasabah"
            className={inputClass(false)}
          />
        </Field>
        <Field label="Pilih nasabah" htmlFor="nasabah" error={fieldError.nasabahId} required>
          <select
            id="nasabah"
            value={nasabahId}
            onChange={(e) => setNasabahId(e.target.value)}
            className={inputClass(!!fieldError.nasabahId)}
          >
            <option value="">— pilih nasabah —</option>
            {nasabahTersaring.map((n) => (
              <option key={n.id} value={n.id}>
                {n.kodeNasabah} · {n.nama}
              </option>
            ))}
          </select>
        </Field>
        {nasabahTersaring.length === 0 && (
          <p className="font-label-sm text-label-sm text-on-surface-variant">
            Tidak ada nasabah yang cocok dengan pencarian.
          </p>
        )}
      </section>

      {/* Item */}
      <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-headline-md text-[16px] font-semibold text-on-surface">
            2. Item Sampah
          </h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setBaris((p) => [...p, barisBaru()])}
          >
            <Plus aria-hidden /> Tambah
          </Button>
        </div>

        {fieldError.items && (
          <p className="font-label-sm text-label-sm text-error">{fieldError.items}</p>
        )}

        <ul className="space-y-3">
          {baris.map((b, i) => (
            <li
              key={i}
              className="rounded-lg border border-outline-variant bg-surface-container-low p-3 space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  Item {i + 1}
                </span>
                {baris.length > 1 && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    aria-label={`Hapus item ${i + 1}`}
                    onClick={() => setBaris((p) => p.filter((_, idx) => idx !== i))}
                  >
                    <Trash2 aria-hidden />
                  </Button>
                )}
              </div>

              <Field label="Jenis sampah" htmlFor={`jenis-${i}`} required>
                <select
                  id={`jenis-${i}`}
                  value={b.jenisSampahId}
                  onChange={(e) => ubahBaris(i, { jenisSampahId: e.target.value })}
                  className={inputClass(false)}
                >
                  <option value="">— pilih jenis —</option>
                  {jenis.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.nama} — {fmtRupiah(j.harga)}/kg
                    </option>
                  ))}
                </select>
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Berat (kg)" htmlFor={`berat-${i}`} required>
                  <input
                    id={`berat-${i}`}
                    type="number"
                    min={0}
                    step="0.01"
                    inputMode="decimal"
                    value={b.berat}
                    onChange={(e) => ubahBaris(i, { berat: e.target.value })}
                    className={`${inputClass(false)} text-right`}
                  />
                </Field>
                <Field label="Kondisi" htmlFor={`kondisi-${i}`} required>
                  <select
                    id={`kondisi-${i}`}
                    value={b.kondisi}
                    onChange={(e) =>
                      ubahBaris(i, { kondisi: e.target.value as KondisiSampah })
                    }
                    className={inputClass(false)}
                  >
                    {KONDISI_SAMPAH_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <p className="text-right font-label-md text-label-md font-mono text-on-surface">
                {rincian[i].berat > 0 && rincian[i].harga > 0
                  ? `${fmtBerat(rincian[i].berat)} kg × ${fmtRupiah(rincian[i].harga)} = ${fmtRupiah(rincian[i].subtotal)}`
                  : "—"}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* Total & pembayaran */}
      <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4 space-y-3">
        <h2 className="font-headline-md text-[16px] font-semibold text-on-surface">
          3. Total &amp; Pembayaran
        </h2>

        <dl aria-live="polite" className="space-y-1">
          <div className="flex items-baseline justify-between">
            <dt className="font-label-md text-label-md text-on-surface-variant">
              Total berat
            </dt>
            <dd className="text-headline-md font-normal font-mono text-on-surface">
              {fmtBerat(totalBerat)} kg
            </dd>
          </div>
          <div className="flex items-baseline justify-between">
            <dt className="font-label-md text-label-md text-on-surface-variant">
              Total nilai
            </dt>
            <dd className="text-headline-md font-mono font-semibold text-primary">
              {fmtRupiah(totalNilai)}
            </dd>
          </div>
        </dl>

        <label className="flex items-start gap-3 rounded-lg border border-outline-variant p-3">
          <input
            type="checkbox"
            checked={cashDibayar}
            onChange={(e) => setCashDibayar(e.target.checked)}
            className="mt-0.5 size-5 accent-primary"
          />
          <span>
            <span className="block font-label-md text-label-md text-on-surface">
              Tunai sudah diserahkan ke warga
            </span>
            <span className="block font-label-sm text-label-sm text-on-surface-variant">
              Pembayaran terjadi di luar sistem (BR-04). Centang setelah uang
              benar-benar diserahkan.
            </span>
          </span>
        </label>
      </section>

      {error && (
        <p role="alert" className="font-label-md text-label-md text-error">
          {error}
        </p>
      )}

      <Button type="submit" className="w-full h-12" disabled={!bisaKirim || mengirim}>
        {mengirim ? "Menyimpan..." : "Simpan Setoran"}
      </Button>
      {!bisaKirim && !mengirim && (
        <p className="text-center font-label-sm text-label-sm text-on-surface-variant">
          Pilih nasabah dan lengkapi setiap item (jenis + berat) untuk menyimpan.
        </p>
      )}
    </form>
  )
}
