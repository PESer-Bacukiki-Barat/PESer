import type { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ChevronLeft } from "lucide-react"

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
import { fmtBerat, fmtRupiah } from "@/lib/format"

export const metadata: Metadata = {
  title: "Detail Dispatch",
}

export const dynamic = "force-dynamic"

/** Detail dispatch untuk petugas — terima, tolak, serah terima (FR-D3..D5). */
export default async function DetailDispatchPetugasPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await getServerUser()
  if (!user?.bankSampahId) redirect("/petugas")

  const dispatch = await prisma.dispatch.findFirst({
    // Scope dari sesi: dispatch bank sampah lain tidak bisa dibuka di sini.
    where: { id, bankSampahId: user.bankSampahId, deletedAt: null },
    include: {
      pembeli: { select: { nama: true } },
      items: { include: { jenisSampah: { select: { nama: true } } } },
    },
  })
  if (!dispatch) notFound()

  const status = dispatch.status as DispatchStatus

  // Tombol diturunkan dari tabel §8.2 — sama dengan yang dipakai panel admin.
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
  const final = STATUS_FINAL.includes(dispatch.status)

  return (
    <>
      <Link
        href="/petugas/dispatch"
        className="tekan-halus inline-flex items-center gap-1 mb-3 font-label-sm text-label-sm text-on-surface-variant hover:text-primary"
      >
        <ChevronLeft className="size-4" aria-hidden />
        Semua dispatch
      </Link>

      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile font-mono text-on-surface truncate">
            {dispatch.kodeDispatch}
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Untuk {dispatch.pembeli.nama}
          </p>
        </div>
        <span
          className={`inline-flex shrink-0 items-center px-2.5 py-1 rounded-full font-label-sm text-label-sm ${statusStyle(status)}`}
        >
          {DISPATCH_STATUS_LABEL[status]}
        </span>
      </div>

      {dispatch.alasanTolak && (
        <div className="mb-4 rounded-xl border border-error bg-error-container/40 p-4">
          <p className="font-label-md text-label-md text-on-error-container">
            Anda menolak dispatch ini
          </p>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            {dispatch.alasanTolak}
          </p>
        </div>
      )}

      {dispatch.selisihSignifikan && (
        <div className="mb-4 rounded-xl border border-tertiary bg-tertiary-container/40 p-4">
          <p className="font-label-md text-label-md text-on-tertiary-container">
            Selisih berat signifikan — menunggu review admin
          </p>
          {dispatch.alasanSelisih && (
            <p className="font-body-md text-body-md text-on-surface-variant mt-1">
              {dispatch.alasanSelisih}
            </p>
          )}
        </div>
      )}

      {/* Aksi ditaruh di atas daftar item: itu yang dicari petugas di lapangan. */}
      <section className="mb-4 rounded-xl border border-outline-variant bg-surface-container-lowest p-4">
        <h2 className="text-title-sm text-on-surface mb-3">
          Aksi
        </h2>
        {final ? (
          <p className="font-body-md text-body-md text-on-surface-variant">
            Status {DISPATCH_STATUS_LABEL[status]} bersifat final.
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
      </section>

      {/* FR-D5. Foto hanya relevan sejak petugas memegang barang; sebelum
          DITERIMA belum ada yang bisa dipotret. Setelah final ia terkunci
          mengikuti BR-13, tapi tetap ditampilkan sebagai bukti. */}
      {(dispatch.status === "DITERIMA" ||
        dispatch.status === "SERAH_TERIMA" ||
        dispatch.fotoBuktiUrl) && (
        <div className="mb-4">
          <FotoBukti
            dispatchId={dispatch.id}
            adaFoto={!!dispatch.fotoBuktiUrl}
            bisaUbah={
              dispatch.status === "DITERIMA" || dispatch.status === "SERAH_TERIMA"
            }
          />
        </div>
      )}

      <section className="rounded-xl border border-outline-variant bg-surface-container-lowest overflow-hidden">
        <div className="px-4 py-3 border-b border-outline-variant bg-surface-bright flex items-baseline justify-between gap-2">
          <h2 className="text-title-sm text-on-surface">
            Item
          </h2>
          <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">
            target {fmtBerat(totalTarget)} kg
          </span>
        </div>
        <ul className="divide-y divide-outline-variant">
          {dispatch.items.map((i) => (
            <li key={i.id} className="px-4 py-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-label-md text-label-md text-on-surface">
                  {i.jenisSampah.nama}
                </p>
                <p className="font-label-sm text-label-sm text-on-surface-variant font-mono">
                  target {fmtBerat(Number(i.beratTarget))} kg ·{" "}
                  {fmtRupiah(Number(i.hargaJualPerKg))}/kg
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-label-md text-label-md font-mono text-on-surface">
                  {i.beratAktual == null
                    ? "—"
                    : `${fmtBerat(Number(i.beratAktual))} kg`}
                </p>
                <p className="font-label-sm text-label-sm text-on-surface-variant font-mono">
                  {fmtRupiah(i.subtotal == null ? null : Number(i.subtotal))}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}
