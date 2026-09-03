import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronRight } from "lucide-react"

import { prisma } from "@/lib/prisma"
import { getServerUser } from "@/lib/auth"
import { aksiTersedia, STATUS_FINAL } from "@/lib/dispatch-aksi"
import {
  DISPATCH_STATUS_LABEL,
  statusStyle,
  type DispatchStatus,
} from "@/lib/dispatch-data"
import {
  AksiDispatchPanel,
  type ItemAksi,
} from "@/components/dispatch/aksi-dispatch"
import { FotoBukti } from "@/components/dispatch/foto-bukti"
import { fmtBerat, fmtRupiah, fmtTanggalWaktu } from "@/lib/format"

export const metadata: Metadata = {
  title: "Detail Dispatch",
}

export const dynamic = "force-dynamic"

export default async function DetailDispatchPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [dispatch, user] = await Promise.all([
    prisma.dispatch.findFirst({
      where: { id, deletedAt: null },
      include: {
        bankSampah: { select: { id: true, nama: true } },
        pembeli: { select: { id: true, nama: true } },
        dibuatOleh: { select: { nama: true } },
        items: { include: { jenisSampah: { select: { nama: true } } } },
      },
    }),
    getServerUser(),
  ])

  if (!dispatch) notFound()
  // Middleware sudah menjamin sesi ada; ini penjaga tipe, bukan cek otorisasi.
  if (!user) notFound()

  const status = dispatch.status as DispatchStatus

  // Sumber tunggal: tabel §8.2. UI tidak menyimpan aturan transisi sendiri.
  const aksi = aksiTersedia(
    dispatch.status,
    { role: user.role, bankSampahId: user.bankSampahId },
    dispatch.bankSampahId,
  )

  const items: ItemAksi[] = dispatch.items.map((i) => ({
    id: i.id,
    jenisSampah: i.jenisSampah.nama,
    beratTarget: Number(i.beratTarget),
    beratAktual: i.beratAktual == null ? null : Number(i.beratAktual),
  }))

  const totalTarget = items.reduce((a, i) => a + i.beratTarget, 0)
  const totalAktual = dispatch.items.every((i) => i.beratAktual != null)
    ? items.reduce((a, i) => a + (i.beratAktual ?? 0), 0)
    : null

  const final = STATUS_FINAL.includes(dispatch.status)

  return (
    <>
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-2 text-on-surface-variant font-label-sm text-label-sm mb-6"
      >
        <Link className="tekan-halus hover:text-primary" href="/admin">
          Dashboard
        </Link>
        <ChevronRight className="size-4" aria-hidden />
        <Link className="tekan-halus hover:text-primary" href="/admin/transaksi">
          Manajemen Transaksi
        </Link>
        <ChevronRight className="size-4" aria-hidden />
        <span className="text-on-surface font-semibold font-mono">
          {dispatch.kodeDispatch}
        </span>
      </nav>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-2 font-mono">
            {dispatch.kodeDispatch}
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            {dispatch.bankSampah.nama} → {dispatch.pembeli.nama}
          </p>
        </div>
        <span
          className={`inline-flex items-center px-3 py-1.5 rounded-full font-label-md text-label-md ${statusStyle(status)}`}
        >
          {DISPATCH_STATUS_LABEL[status]}
        </span>
      </div>

      {/* Peringatan yang perlu perhatian admin */}
      {dispatch.selisihSignifikan && (
        <div
          role="status"
          className="mb-6 rounded-xl border border-tertiary bg-tertiary-container/40 px-5 py-4"
        >
          <p className="font-label-md text-label-md text-on-tertiary-container">
            Selisih berat signifikan — perlu direview sebelum ditutup
          </p>
          {dispatch.alasanSelisih && (
            <p className="font-body-md text-body-md text-on-surface-variant mt-1">
              Alasan petugas: {dispatch.alasanSelisih}
            </p>
          )}
        </div>
      )}
      {dispatch.alasanTolak && (
        <div
          role="status"
          className="mb-6 rounded-xl border border-error bg-error-container/40 px-5 py-4"
        >
          <p className="font-label-md text-label-md text-on-error-container">
            Ditolak petugas
          </p>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            {dispatch.alasanTolak}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ringkasan */}
        <section className="lg:col-span-1 bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-outline-variant bg-surface-bright">
            <h2 className="text-title-md text-on-surface">
              Ringkasan
            </h2>
          </div>
          <dl className="divide-y divide-outline-variant">
            {[
              ["Bank Sampah", dispatch.bankSampah.nama],
              ["Pembeli", dispatch.pembeli.nama],
              ["Tanggal Jemput", fmtTanggalWaktu(dispatch.tanggalJemput)],
              ["Dibuat Oleh", dispatch.dibuatOleh.nama],
              ["Total Target", `${fmtBerat(totalTarget)} kg`],
              ["Total Aktual", totalAktual == null ? "—" : `${fmtBerat(totalAktual)} kg`],
              [
                "Nilai Penjualan",
                fmtRupiah(dispatch.totalNilai == null ? null : Number(dispatch.totalNilai)),
              ],
            ].map(([k, v]) => (
              <div key={k} className="flex items-baseline justify-between gap-3 px-5 py-3">
                <dt className="font-label-sm text-label-sm text-on-surface-variant">{k}</dt>
                <dd className="font-label-md text-label-md text-on-surface text-right">{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Item */}
        <section className="lg:col-span-2 bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-outline-variant bg-surface-bright">
            <h2 className="text-title-md text-on-surface">
              Item Dispatch
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-surface-container-low">
                <tr>
                  <th className="px-5 py-3 font-label-sm text-label-sm text-on-surface-variant">
                    Jenis Sampah
                  </th>
                  <th className="px-5 py-3 font-label-sm text-label-sm text-on-surface-variant text-right">
                    Target
                  </th>
                  <th className="px-5 py-3 font-label-sm text-label-sm text-on-surface-variant text-right">
                    Aktual
                  </th>
                  <th className="px-5 py-3 font-label-sm text-label-sm text-on-surface-variant text-right">
                    Harga/kg
                  </th>
                  <th className="px-5 py-3 font-label-sm text-label-sm text-on-surface-variant text-right">
                    Subtotal
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {dispatch.items.map((i) => (
                  <tr key={i.id}>
                    <td className="px-5 py-3 font-body-md text-body-md text-on-surface">
                      {i.jenisSampah.nama}
                    </td>
                    <td className="px-5 py-3 font-mono text-body-md text-on-surface-variant text-right">
                      {fmtBerat(Number(i.beratTarget))} kg
                    </td>
                    <td className="px-5 py-3 font-mono text-body-md text-on-surface text-right">
                      {i.beratAktual == null ? "—" : `${fmtBerat(Number(i.beratAktual))} kg`}
                    </td>
                    <td className="px-5 py-3 font-mono text-body-md text-on-surface-variant text-right">
                      {fmtRupiah(Number(i.hargaJualPerKg))}
                    </td>
                    <td className="px-5 py-3 font-mono text-body-md text-on-surface text-right">
                      {fmtRupiah(i.subtotal == null ? null : Number(i.subtotal))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Aksi */}
      <section className="mt-6 bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm">
        <div className="px-5 py-4 border-b border-outline-variant bg-surface-bright">
          <h2 className="text-title-md text-on-surface">
            Aksi
          </h2>
          <p className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">
            Hanya transisi yang diizinkan tabel state machine untuk peran Anda yang muncul.
          </p>
        </div>
        <div className="px-5 py-4">
          {final ? (
            <p className="font-body-md text-body-md text-on-surface-variant">
              Status {DISPATCH_STATUS_LABEL[status]} bersifat final — tidak ada aksi lanjutan.
            </p>
          ) : (
            <AksiDispatchPanel
              dispatchId={dispatch.id}
              items={items}
              aksi={aksi}
              totalNilaiSaatIni={
                dispatch.totalNilai == null ? null : Number(dispatch.totalNilai)
              }
            />
          )}
        </div>
      </section>

      {/* FR-D6: admin memverifikasi sebelum menutup dispatch, dan foto bukti
          adalah salah satu yang diverifikasi. Hanya baca — yang memotret
          adalah petugas di lokasi (FR-D5). */}
      {dispatch.fotoBuktiUrl && (
        <section className="mt-4">
          <FotoBukti dispatchId={dispatch.id} adaFoto bisaUbah={false} />
        </section>
      )}
    </>
  )
}
