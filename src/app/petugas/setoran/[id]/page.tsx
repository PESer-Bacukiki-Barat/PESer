import type { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { CheckCircle2 } from "lucide-react"

import { prisma } from "@/lib/prisma"
import { getServerUser } from "@/lib/auth"
import { Badge } from "@/components/ui/badge"
import { KONDISI_SAMPAH_LABEL, kondisiStyle, type KondisiSampah } from "@/lib/setoran-data"

export const metadata: Metadata = {
  title: "Bukti Setor",
}

export const dynamic = "force-dynamic"

const fmtBerat = (n: number) =>
  new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(n)

const fmtRupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n)

/** Bukti setor — FR-C4. Ditampilkan ke warga setelah setoran tersimpan. */
export default async function BuktiSetorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await getServerUser()
  if (!user?.bankSampahId) redirect("/petugas")

  const setoran = await prisma.setoran.findFirst({
    // Scope dari sesi: petugas tidak bisa membuka bukti setor bank sampah lain.
    where: { id, bankSampahId: user.bankSampahId },
    include: {
      nasabah: { select: { kodeNasabah: true, nama: true } },
      petugas: { select: { nama: true } },
      bankSampah: { select: { nama: true } },
      items: { include: { jenisSampah: { select: { nama: true } } } },
    },
  })
  if (!setoran) notFound()

  return (
    <>
      <div className="mb-4 flex items-start gap-3 rounded-xl border border-secondary-fixed bg-secondary-container/50 p-4">
        <CheckCircle2 className="size-5 shrink-0 text-on-secondary-container" aria-hidden />
        <div className="min-w-0">
          <p className="font-headline-md text-[16px] font-semibold text-on-secondary-container">
            Setoran tersimpan
          </p>
          <p className="font-label-sm text-label-sm text-on-surface-variant">
            Stock bank sampah sudah bertambah otomatis.
          </p>
        </div>
      </div>

      <section className="rounded-xl border border-outline-variant bg-surface-container-lowest overflow-hidden">
        <div className="px-4 py-3 border-b border-outline-variant bg-surface-bright flex items-center justify-between gap-2">
          <h1 className="font-headline-md text-[16px] font-semibold font-mono text-on-surface">
            {setoran.kodeTransaksi}
          </h1>
          <Badge variant={setoran.cashDibayar ? "secondary" : "outline"}>
            {setoran.cashDibayar ? "Tunai lunas" : "Tunai belum"}
          </Badge>
        </div>

        <dl className="divide-y divide-outline-variant">
          {[
            ["Nasabah", `${setoran.nasabah.kodeNasabah} · ${setoran.nasabah.nama}`],
            ["Bank Sampah", setoran.bankSampah.nama],
            ["Petugas", setoran.petugas.nama],
            [
              "Tanggal",
              setoran.tanggal.toLocaleString("id-ID", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              }),
            ],
          ].map(([k, v]) => (
            <div key={k} className="flex items-baseline justify-between gap-3 px-4 py-2.5">
              <dt className="font-label-sm text-label-sm text-on-surface-variant">{k}</dt>
              <dd className="font-label-md text-label-md text-on-surface text-right">{v}</dd>
            </div>
          ))}
        </dl>

        <ul className="divide-y divide-outline-variant border-t border-outline-variant">
          {setoran.items.map((i) => (
            <li key={i.id} className="px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-label-md text-label-md text-on-surface">
                    {i.jenisSampah.nama}
                  </p>
                  <p className="font-label-sm text-label-sm text-on-surface-variant font-mono">
                    {fmtBerat(Number(i.berat))} kg × {fmtRupiah(Number(i.hargaSaatItu))}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-label-md text-label-md font-mono text-on-surface">
                    {fmtRupiah(Number(i.subtotal))}
                  </p>
                  <span
                    className={`mt-1 inline-flex items-center px-2 py-0.5 rounded-full font-label-sm text-label-sm ${kondisiStyle(
                      i.kondisi as KondisiSampah,
                    )}`}
                  >
                    {KONDISI_SAMPAH_LABEL[i.kondisi as KondisiSampah]}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <div className="px-4 py-3 border-t border-outline-variant bg-surface-container-low space-y-1">
          <div className="flex items-baseline justify-between">
            <span className="font-label-md text-label-md text-on-surface-variant">
              Total berat
            </span>
            <span className="font-label-md text-label-md font-mono text-on-surface">
              {fmtBerat(Number(setoran.totalBerat))} kg
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="font-label-md text-label-md text-on-surface-variant">
              Total dibayar
            </span>
            <span className="text-headline-md font-mono font-semibold text-primary">
              {fmtRupiah(Number(setoran.totalNilai))}
            </span>
          </div>
        </div>
      </section>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Link
          href="/petugas/setor"
          className="flex h-11 items-center justify-center rounded-lg bg-primary font-label-md text-label-md text-on-primary transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/50"
        >
          Setor Lagi
        </Link>
        <Link
          href="/petugas/riwayat"
          className="flex h-11 items-center justify-center rounded-lg border border-outline-variant font-label-md text-label-md text-on-surface transition-colors hover:bg-surface-container-low focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/50"
        >
          Lihat Riwayat
        </Link>
      </div>
    </>
  )
}
