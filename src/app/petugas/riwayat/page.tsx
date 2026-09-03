import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { ChevronRight } from "lucide-react"

import { prisma } from "@/lib/prisma"
import { getServerUser } from "@/lib/auth"
import { fmtBerat, fmtRupiah, fmtTanggal } from "@/lib/format"

export const metadata: Metadata = {
  title: "Riwayat Setoran",
}

export const dynamic = "force-dynamic"

/**
 * Riwayat setoran — FR-C9 "PETUGAS (sendiri)".
 *
 * Dibatasi ke bank sampah petugas, bukan ke petugas yang mencatat: satu bank
 * sampah bisa punya beberapa petugas (BR-02) dan mereka bergantian jaga, jadi
 * riwayat per bank sampah yang berguna di lapangan.
 */
export default async function RiwayatPage() {
  const user = await getServerUser()
  if (!user?.bankSampahId) redirect("/petugas")

  const setoran = await prisma.setoran.findMany({
    where: { bankSampahId: user.bankSampahId },
    orderBy: { tanggal: "desc" },
    take: 50,
    select: {
      id: true,
      kodeTransaksi: true,
      tanggal: true,
      totalBerat: true,
      totalNilai: true,
      cashDibayar: true,
      nasabah: { select: { nama: true } },
      petugas: { select: { nama: true } },
      _count: { select: { items: true } },
    },
  })

  const totalNilai = setoran.reduce((a, s) => a + Number(s.totalNilai), 0)
  const totalBerat = setoran.reduce((a, s) => a + Number(s.totalBerat), 0)

  return (
    <>
      <div className="mb-4">
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
          Riwayat Setoran
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant mt-1">
          {setoran.length === 0
            ? "Belum ada setoran tercatat."
            : `${setoran.length} setoran terakhir · ${fmtBerat(totalBerat)} kg · ${fmtRupiah(totalNilai)}`}
        </p>
      </div>

      {setoran.length === 0 ? (
        <Link
          href="/petugas/setor"
          className="flex h-12 items-center justify-center rounded-lg bg-primary font-label-md text-label-md text-on-primary transition-colors hover:bg-primary/90"
        >
          Catat Setoran Pertama
        </Link>
      ) : (
        <ul className="space-y-2">
          {setoran.map((s) => (
            <li key={s.id}>
              <Link
                href={`/petugas/setoran/${s.id}`}
                className="flex items-center gap-3 rounded-xl border border-outline-variant bg-surface-container-lowest p-4 transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/50"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-label-md text-label-md font-mono text-on-surface truncate">
                    {s.kodeTransaksi}
                  </p>
                  <p className="font-label-sm text-label-sm text-on-surface-variant truncate">
                    {s.nasabah.nama} · {s._count.items} item ·{" "}
                    {fmtTanggal(s.tanggal)}
                  </p>
                  {!s.cashDibayar && (
                    <p className="font-label-sm text-label-sm text-error mt-0.5">
                      Tunai belum diserahkan
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="font-label-md text-label-md font-mono text-on-surface">
                    {fmtRupiah(Number(s.totalNilai))}
                  </p>
                  <p className="font-label-sm text-label-sm text-on-surface-variant font-mono">
                    {fmtBerat(Number(s.totalBerat))} kg
                  </p>
                </div>
                <ChevronRight
                  className="size-4 shrink-0 text-on-surface-variant"
                  aria-hidden
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
