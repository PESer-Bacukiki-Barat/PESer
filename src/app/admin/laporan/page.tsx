import type { Metadata } from "next"
import Link from "next/link"
import { ChevronRight, Download } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  laporanPenjualan,
  laporanVolume,
  type RincianPenjualan,
  type RincianVolume,
} from "@/lib/laporan"
import { fmtBerat, fmtRupiah, fmtTanggal } from "@/lib/format"

export const metadata: Metadata = {
  title: "Laporan",
}

/**
 * PRD §4.3 [WAJIB]: "Jangan cache halaman dispatch/laporan (stock basi →
 * dispatch dobel jual)." force-dynamic memastikan angkanya selalu dihitung
 * ulang, dan endpointnya juga mengirim Cache-Control: no-store.
 */
export const dynamic = "force-dynamic"
export const revalidate = 0

/** Tanggal valid dari query, atau undefined kalau kosong/ngawur. */
function tanggalDari(nilai: string | undefined): Date | undefined {
  if (!nilai) return undefined
  const d = new Date(nilai)
  return Number.isNaN(d.getTime()) ? undefined : d
}

export default async function LaporanPage({
  searchParams,
}: {
  searchParams: Promise<{ dari?: string; sampai?: string }>
}) {
  const q = await searchParams
  const dari = tanggalDari(q.dari)
  // Batas akhir dibuat inklusif sampai akhir hari; tanpa ini setoran pada
  // tanggal "sampai" jam 10 pagi akan terlewat karena dibandingkan ke 00:00.
  const sampai = tanggalDari(q.sampai)
  if (sampai) sampai.setHours(23, 59, 59, 999)

  const periode = { dari, sampai }
  const [penjualan, volume] = await Promise.all([
    laporanPenjualan(periode),
    laporanVolume(periode),
  ])

  const paramUnduh = new URLSearchParams()
  if (q.dari) paramUnduh.set("dari", q.dari)
  if (q.sampai) paramUnduh.set("sampai", q.sampai)
  const qs = (extra: string) => {
    const p = new URLSearchParams(paramUnduh)
    p.set("format", "csv")
    return `${extra}?${p.toString()}`
  }

  return (
    <>
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-2 text-on-surface-variant font-label-sm text-label-sm mb-6"
      >
        <Link className="hover:text-primary transition-colors" href="/admin">
          Dashboard
        </Link>
        <ChevronRight className="size-4" />
        <span className="text-on-surface font-semibold">Laporan</span>
      </nav>

      <div className="mb-6">
        <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-2">
          Laporan
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
          Volume sampah masuk dan penjualan ke pembeli. Penjualan hanya menghitung
          dispatch berstatus Selesai, sehingga angkanya tidak berubah retroaktif.
        </p>
      </div>

      {/* Filter periode — form GET biasa, tanpa JavaScript */}
      <form
        method="get"
        className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-outline-variant bg-surface-container-lowest p-4"
      >
        <div>
          <label
            htmlFor="dari"
            className="block font-label-sm text-label-sm text-on-surface-variant mb-1"
          >
            Dari tanggal
          </label>
          <input
            id="dari"
            name="dari"
            type="date"
            defaultValue={q.dari ?? ""}
            className="h-10 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 font-body-md text-body-md text-on-surface outline-none focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/50"
          />
        </div>
        <div>
          <label
            htmlFor="sampai"
            className="block font-label-sm text-label-sm text-on-surface-variant mb-1"
          >
            Sampai tanggal
          </label>
          <input
            id="sampai"
            name="sampai"
            type="date"
            defaultValue={q.sampai ?? ""}
            className="h-10 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 font-body-md text-body-md text-on-surface outline-none focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/50"
          />
        </div>
        <button
          type="submit"
          className="h-10 rounded-lg bg-primary px-4 font-label-md text-label-md text-on-primary transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/50"
        >
          Terapkan
        </button>
        {(q.dari || q.sampai) && (
          <Link
            href="/admin/laporan"
            className="h-10 flex items-center rounded-lg border border-outline-variant px-4 font-label-md text-label-md text-on-surface transition-colors hover:bg-surface-container-low"
          >
            Reset
          </Link>
        )}
        <p className="w-full font-label-sm text-label-sm text-on-surface-variant">
          {dari || sampai
            ? `Periode: ${q.dari ?? "awal"} sampai ${q.sampai ?? "sekarang"} (inklusif)`
            : "Tanpa filter — seluruh data."}
        </p>
      </form>

      {/* Penjualan */}
      <section className="mb-8">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-title-md text-on-surface">
            Penjualan ke Pembeli
          </h2>
          <a
            href={qs("/api/laporan/penjualan")}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-outline-variant px-4 font-label-md text-label-md text-on-surface transition-colors hover:bg-surface-container-low"
          >
            <Download className="size-4" aria-hidden />
            Export CSV
          </a>
        </div>

        <div className="mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Kartu label="Transaksi Selesai" nilai={String(penjualan.ringkasan.transaksi)} />
          <Kartu label="Berat Terjual" nilai={`${fmtBerat(penjualan.ringkasan.berat)} kg`} />
          <Kartu
            label="Nilai Penjualan"
            nilai={fmtRupiah(penjualan.ringkasan.nilai)}
            utama
          />
        </div>

        {penjualan.baris.length === 0 ? (
          <Kosong pesan="Belum ada dispatch berstatus Selesai pada periode ini." />
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
              <Rincian judul="Per Bank Sampah" items={penjualan.perBankSampah} />
              <Rincian judul="Per Pembeli" items={penjualan.perPembeli} />
              <Rincian judul="Per Jenis Sampah" items={penjualan.perJenisSampah} />
            </div>

            <Tabel
              kepala={[
                "Kode",
                "Tanggal",
                "Bank Sampah",
                "Pembeli",
                "Berat Aktual",
                "Nilai",
                "",
              ]}
            >
              {penjualan.baris.map((b) => (
                <tr key={b.kodeDispatch}>
                  <td className="px-4 py-3 font-mono text-body-md text-on-surface whitespace-nowrap">
                    {b.kodeDispatch}
                  </td>
                  <td className="px-4 py-3 font-body-md text-body-md text-on-surface-variant whitespace-nowrap">
                    {fmtTanggal(b.tanggal)}
                  </td>
                  <td className="px-4 py-3 font-body-md text-body-md text-on-surface">
                    {b.bankSampah}
                  </td>
                  <td className="px-4 py-3 font-body-md text-body-md text-on-surface">
                    {b.pembeli}
                  </td>
                  <td className="px-4 py-3 font-mono text-body-md text-on-surface-variant text-right whitespace-nowrap">
                    {fmtBerat(b.beratAktual)} kg
                  </td>
                  <td className="px-4 py-3 font-mono text-body-md text-on-surface text-right whitespace-nowrap">
                    {fmtRupiah(b.totalNilai)}
                  </td>
                  <td className="px-4 py-3">
                    {b.selisihSignifikan && (
                      <Badge variant="destructive">Selisih signifikan</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </Tabel>
          </>
        )}
      </section>

      {/* Volume masuk */}
      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-title-md text-on-surface">
            Volume Masuk dari Warga
          </h2>
          <a
            href={qs("/api/laporan/volume")}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-outline-variant px-4 font-label-md text-label-md text-on-surface transition-colors hover:bg-surface-container-low"
          >
            <Download className="size-4" aria-hidden />
            Export CSV
          </a>
        </div>

        <div className="mb-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Kartu label="Setoran" nilai={String(volume.ringkasan.setoran)} />
          <Kartu label="Berat Masuk" nilai={`${fmtBerat(volume.ringkasan.berat)} kg`} />
          <Kartu
            label="Dibayar ke Warga"
            nilai={fmtRupiah(volume.ringkasan.nilai)}
            utama
          />
          <Kartu
            label="Nasabah Menyetor"
            nilai={String(volume.ringkasan.nasabahAktif)}
            sub={
              volume.ringkasan.tunaiBelum > 0
                ? `${volume.ringkasan.tunaiBelum} setoran tunai belum diserahkan`
                : undefined
            }
          />
        </div>

        {volume.baris.length === 0 ? (
          <Kosong pesan="Belum ada setoran pada periode ini." />
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
              <Rincian judul="Per Bank Sampah" items={volume.perBankSampah} />
              <Rincian judul="Per Jenis Sampah" items={volume.perJenisSampah} />
            </div>

            <Tabel
              kepala={["Kode", "Tanggal", "Bank Sampah", "Nasabah", "Berat", "Dibayar", "Tunai"]}
            >
              {volume.baris.map((b) => (
                <tr key={b.kodeTransaksi}>
                  <td className="px-4 py-3 font-mono text-body-md text-on-surface whitespace-nowrap">
                    {b.kodeTransaksi}
                  </td>
                  <td className="px-4 py-3 font-body-md text-body-md text-on-surface-variant whitespace-nowrap">
                    {fmtTanggal(b.tanggal)}
                  </td>
                  <td className="px-4 py-3 font-body-md text-body-md text-on-surface">
                    {b.bankSampah}
                  </td>
                  <td className="px-4 py-3 font-body-md text-body-md text-on-surface">
                    {b.nasabah}
                  </td>
                  <td className="px-4 py-3 font-mono text-body-md text-on-surface-variant text-right whitespace-nowrap">
                    {fmtBerat(b.totalBerat)} kg
                  </td>
                  <td className="px-4 py-3 font-mono text-body-md text-on-surface text-right whitespace-nowrap">
                    {fmtRupiah(b.totalNilai)}
                  </td>
                  <td className="px-4 py-3">
                    {b.cashDibayar ? (
                      <Badge variant="secondary">Lunas</Badge>
                    ) : (
                      <Badge variant="destructive">Belum</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </Tabel>
          </>
        )}
      </section>
    </>
  )
}

function Kartu({
  label,
  nilai,
  sub,
  utama,
}: {
  label: string
  nilai: string
  sub?: string
  utama?: boolean
}) {
  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4">
      <p className="font-label-sm text-label-sm text-on-surface-variant">{label}</p>
      <p
        className={`text-headline-md font-mono font-semibold ${
          utama ? "text-primary" : "text-on-surface"
        }`}
      >
        {nilai}
      </p>
      {sub && (
        <p className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">{sub}</p>
      )}
    </div>
  )
}

function Kosong({ pesan }: { pesan: string }) {
  return (
    <p className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 font-body-md text-body-md text-on-surface-variant">
      {pesan}
    </p>
  )
}

function Rincian({
  judul,
  items,
}: {
  judul: string
  items: (RincianPenjualan | RincianVolume)[]
}) {
  return (
    <section className="rounded-xl border border-outline-variant bg-surface-container-lowest overflow-hidden">
      <h3 className="px-4 py-3 border-b border-outline-variant bg-surface-bright font-label-md text-label-md text-on-surface">
        {judul}
      </h3>
      <ul className="divide-y divide-outline-variant">
        {items.map((r) => (
          <li key={r.nama} className="flex items-baseline justify-between gap-3 px-4 py-2.5">
            <span className="font-body-md text-body-md text-on-surface truncate">
              {r.nama}
            </span>
            <span className="text-right shrink-0">
              <span className="block font-label-md text-label-md font-mono text-on-surface">
                {fmtRupiah(r.nilai)}
              </span>
              <span className="block font-label-sm text-label-sm font-mono text-on-surface-variant">
                {fmtBerat(r.berat)} kg
              </span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}

function Tabel({
  kepala,
  children,
}: {
  kepala: string[]
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-surface-container-low">
            <tr>
              {kepala.map((h, i) => (
                <th
                  key={`${h}-${i}`}
                  className="px-4 py-3 font-label-sm text-label-sm text-on-surface-variant whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant">{children}</tbody>
        </table>
      </div>
    </div>
  )
}
