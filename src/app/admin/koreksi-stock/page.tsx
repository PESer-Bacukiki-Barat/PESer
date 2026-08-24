import type { Metadata } from "next"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

import { prisma } from "@/lib/prisma"
import { Badge } from "@/components/ui/badge"

export const metadata: Metadata = {
  title: "Riwayat Koreksi Stock",
}

export const dynamic = "force-dynamic"

const fmtBerat = (n: number) =>
  new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(n)

/**
 * FR-C8 sisi ADMIN — "Lihat riwayat koreksi stock | PETUGAS, ADMIN".
 *
 * Read-only: koreksi hanya boleh dilakukan petugas di bank sampahnya sendiri
 * (FR-C7), jadi tidak ada aksi tulis di halaman ini. Nilainya justru sebagai
 * pengawasan — koreksi berlaku langsung tanpa approval, sehingga admin perlu
 * bisa melihat siapa mengubah apa dan dengan alasan apa.
 */
export default async function KoreksiStockAdminPage() {
  const koreksi = await prisma.koreksiStock.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      beratSebelum: true,
      beratSesudah: true,
      alasan: true,
      createdAt: true,
      dilakukanOleh: { select: { nama: true } },
      stock: {
        select: {
          jenisSampah: { select: { nama: true } },
          bankSampah: { select: { nama: true } },
        },
      },
    },
  })

  const turun = koreksi.filter(
    (k) => Number(k.beratSesudah) < Number(k.beratSebelum),
  ).length

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
        <span className="text-on-surface font-semibold">Riwayat Koreksi Stock</span>
      </nav>

      <div className="mb-6">
        <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-2">
          Riwayat Koreksi Stock
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
          Koreksi stock berlaku langsung tanpa persetujuan (FR-C7), jadi halaman ini
          adalah jalur pengawasannya.
        </p>
      </div>

      {koreksi.length === 0 ? (
        <p className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 font-body-md text-body-md text-on-surface-variant">
          Belum ada koreksi stock tercatat.
        </p>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Badge variant="outline">{koreksi.length} koreksi terakhir</Badge>
            {turun > 0 && <Badge variant="destructive">{turun} menurunkan stock</Badge>}
          </div>

          <div className="rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-surface-container-low">
                  <tr>
                    {[
                      "Waktu",
                      "Bank Sampah",
                      "Jenis Sampah",
                      "Sebelum",
                      "Sesudah",
                      "Selisih",
                      "Petugas",
                      "Alasan",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 font-label-sm text-label-sm text-on-surface-variant whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {koreksi.map((k) => {
                    const sebelum = Number(k.beratSebelum)
                    const sesudah = Number(k.beratSesudah)
                    const delta = sesudah - sebelum
                    return (
                      <tr key={k.id}>
                        <td className="px-4 py-3 font-label-sm text-label-sm text-on-surface-variant whitespace-nowrap">
                          {k.createdAt.toLocaleString("id-ID", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="px-4 py-3 font-body-md text-body-md text-on-surface whitespace-nowrap">
                          {k.stock.bankSampah.nama}
                        </td>
                        <td className="px-4 py-3 font-body-md text-body-md text-on-surface whitespace-nowrap">
                          {k.stock.jenisSampah.nama}
                        </td>
                        <td className="px-4 py-3 font-mono text-body-md text-on-surface-variant text-right whitespace-nowrap">
                          {fmtBerat(sebelum)} kg
                        </td>
                        <td className="px-4 py-3 font-mono text-body-md text-on-surface text-right whitespace-nowrap">
                          {fmtBerat(sesudah)} kg
                        </td>
                        <td
                          className={`px-4 py-3 font-mono text-body-md text-right whitespace-nowrap ${
                            delta > 0 ? "text-primary" : "text-error"
                          }`}
                        >
                          {delta > 0 ? "+" : ""}
                          {fmtBerat(delta)} kg
                        </td>
                        <td className="px-4 py-3 font-body-md text-body-md text-on-surface whitespace-nowrap">
                          {k.dilakukanOleh.nama}
                        </td>
                        <td className="px-4 py-3 font-body-md text-body-md text-on-surface-variant max-w-xs">
                          {k.alasan}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </>
  )
}
