import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { Scale, Truck } from "lucide-react"

import { prisma } from "@/lib/prisma"
import { getServerUser } from "@/lib/auth"
import { aksiTersedia } from "@/lib/dispatch-aksi"
import {
  DISPATCH_STATUS_LABEL,
  statusStyle,
  type DispatchStatus,
} from "@/lib/dispatch-data"
import { fmtBerat, fmtRupiah } from "@/lib/format"

export const metadata: Metadata = {
  title: "Beranda Petugas",
}

export const dynamic = "force-dynamic"

/** Awal hari ini menurut waktu server — batas untuk rekap "hari ini". */
function awalHariIni(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

export default async function BerandaPetugasPage() {
  const user = await getServerUser()
  if (!user?.bankSampahId) redirect("/petugas")
  const bankSampahId = user.bankSampahId

  const [setoranHariIni, stockRows, dispatchAktif] = await Promise.all([
    prisma.setoran.findMany({
      where: { bankSampahId, tanggal: { gte: awalHariIni() } },
      select: { totalBerat: true, totalNilai: true, cashDibayar: true },
    }),
    prisma.stock.findMany({
      where: { bankSampahId },
      select: { berat: true, beratReservasi: true },
    }),
    prisma.dispatch.findMany({
      where: { bankSampahId, deletedAt: null },
      orderBy: { tanggalJemput: "asc" },
      select: {
        id: true,
        kodeDispatch: true,
        status: true,
        pembeli: { select: { nama: true } },
      },
    }),
  ])

  const beratHariIni = setoranHariIni.reduce((a, s) => a + Number(s.totalBerat), 0)
  const nilaiHariIni = setoranHariIni.reduce((a, s) => a + Number(s.totalNilai), 0)
  const tunaiBelum = setoranHariIni.filter((s) => !s.cashDibayar).length

  const totalStock = stockRows.reduce((a, s) => a + Number(s.berat), 0)
  const reservasi = stockRows.reduce((a, s) => a + Number(s.beratReservasi), 0)

  const pengguna = { role: user.role, bankSampahId }
  const perluTindakan = dispatchAktif.filter(
    (d) => aksiTersedia(d.status, pengguna, bankSampahId).length > 0,
  )

  return (
    <>
      <div className="mb-4">
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
          Beranda
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant mt-1">
          Rekap hari ini dan hal yang menunggu Anda.
        </p>
      </div>

      {/* Aksi utama: yang paling sering dilakukan petugas */}
      <Link
        href="/petugas/setor"
        className="mb-4 flex items-center gap-3 rounded-xl bg-primary px-5 py-4 text-on-primary transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/50"
      >
        <Scale className="size-6 shrink-0" aria-hidden />
        <span>
          <span className="block font-headline-md text-[16px] font-semibold">
            Catat Setoran
          </span>
          <span className="block font-label-sm text-label-sm opacity-90">
            Timbang, hitung otomatis, serahkan tunai
          </span>
        </span>
      </Link>

      {/* Rekap hari ini */}
      <section className="mb-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4">
          <p className="font-label-sm text-label-sm text-on-surface-variant">
            Setoran hari ini
          </p>
          <p className="text-headline-md font-mono font-semibold text-on-surface">
            {setoranHariIni.length}
          </p>
          <p className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">
            {fmtBerat(beratHariIni)} kg · {fmtRupiah(nilaiHariIni)}
          </p>
        </div>
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4">
          <p className="font-label-sm text-label-sm text-on-surface-variant">
            Stock tersedia
          </p>
          <p className="text-headline-md font-mono font-semibold text-on-surface">
            {fmtBerat(totalStock - reservasi)} kg
          </p>
          <p className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">
            dari {fmtBerat(totalStock)} kg total
          </p>
        </div>
      </section>

      {tunaiBelum > 0 && (
        <p className="mb-4 rounded-xl border border-error bg-error-container/40 p-4 font-label-md text-label-md text-on-error-container">
          {tunaiBelum} setoran hari ini belum ditandai tunai diserahkan.
        </p>
      )}

      {/* Dispatch yang menunggu petugas */}
      <section className="rounded-xl border border-outline-variant bg-surface-container-lowest overflow-hidden">
        <div className="px-4 py-3 border-b border-outline-variant bg-surface-bright flex items-center justify-between gap-2">
          <h2 className="font-headline-md text-[16px] font-semibold text-on-surface">
            Menunggu Anda
          </h2>
          <Link
            href="/petugas/dispatch"
            className="font-label-sm text-label-sm text-primary hover:underline"
          >
            Semua
          </Link>
        </div>
        {perluTindakan.length === 0 ? (
          <p className="px-4 py-5 font-body-md text-body-md text-on-surface-variant">
            Tidak ada dispatch yang menunggu tindakan Anda.
          </p>
        ) : (
          <ul className="divide-y divide-outline-variant">
            {perluTindakan.map((d) => (
              <li key={d.id}>
                <Link
                  href={`/petugas/dispatch/${d.id}`}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-container-low"
                >
                  <Truck className="size-4 shrink-0 text-on-surface-variant" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block font-label-md text-label-md font-mono text-on-surface truncate">
                      {d.kodeDispatch}
                    </span>
                    <span className="block font-label-sm text-label-sm text-on-surface-variant truncate">
                      {d.pembeli.nama}
                    </span>
                  </span>
                  <span
                    className={`inline-flex shrink-0 items-center px-2.5 py-1 rounded-full font-label-sm text-label-sm ${statusStyle(
                      d.status as DispatchStatus,
                    )}`}
                  >
                    {DISPATCH_STATUS_LABEL[d.status as DispatchStatus]}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}
