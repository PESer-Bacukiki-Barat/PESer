import type { Metadata } from "next"
import Link from "next/link"
import { Building2, Package, Truck, Users } from "lucide-react"

import { prisma } from "@/lib/prisma"
import { Badge } from "@/components/ui/badge"
import { STATUS_FINAL } from "@/lib/dispatch-aksi"
import { DISPATCH_STATUS_LABEL, statusStyle, type DispatchStatus } from "@/lib/dispatch-data"

export const metadata: Metadata = {
  title: "Dashboard",
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

/** Dispatch yang belum final = masih menunggu tindakan seseorang. */
const BELUM_FINAL = { notIn: [...STATUS_FINAL] }

export default async function AdminDashboardPage() {
  const [
    jumlahBankSampah,
    jumlahNasabah,
    jumlahJenisSampah,
    stockRows,
    dispatchPerluTindakan,
    setoranTerakhir,
    totalNilaiSelesai,
  ] = await Promise.all([
    prisma.bankSampah.count({ where: { deletedAt: null, isActive: true } }),
    prisma.nasabah.count({ where: { deletedAt: null, isActive: true } }),
    prisma.jenisSampah.count({ where: { deletedAt: null, isActive: true } }),
    prisma.stock.findMany({
      select: {
        berat: true,
        beratReservasi: true,
        jenisSampah: { select: { nama: true } },
      },
    }),
    prisma.dispatch.findMany({
      where: { deletedAt: null, status: BELUM_FINAL },
      orderBy: { tanggalJemput: "asc" },
      take: 6,
      select: {
        id: true,
        kodeDispatch: true,
        status: true,
        tanggalJemput: true,
        bankSampah: { select: { nama: true } },
        pembeli: { select: { nama: true } },
      },
    }),
    prisma.setoran.findMany({
      orderBy: { tanggal: "desc" },
      take: 5,
      select: {
        id: true,
        kodeTransaksi: true,
        tanggal: true,
        totalBerat: true,
        totalNilai: true,
        nasabah: { select: { nama: true } },
        bankSampah: { select: { nama: true } },
      },
    }),
    prisma.dispatch.aggregate({
      where: { deletedAt: null, status: "SELESAI" },
      _sum: { totalNilai: true },
    }),
  ])

  const totalStock = stockRows.reduce((a, s) => a + Number(s.berat), 0)
  const totalReservasi = stockRows.reduce((a, s) => a + Number(s.beratReservasi), 0)

  const perJenis = new Map<string, number>()
  for (const s of stockRows) {
    perJenis.set(
      s.jenisSampah.nama,
      (perJenis.get(s.jenisSampah.nama) ?? 0) + Number(s.berat),
    )
  }
  const jenisTeratas = [...perJenis.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6)

  const kartu = [
    {
      label: "Bank Sampah Aktif",
      nilai: String(jumlahBankSampah),
      Icon: Building2,
      href: "/admin/bank-sampah",
    },
    {
      label: "Nasabah Aktif",
      nilai: String(jumlahNasabah),
      Icon: Users,
      href: "/admin/nasabah",
    },
    {
      label: "Total Stock",
      nilai: `${fmtBerat(totalStock)} kg`,
      sub:
        totalReservasi > 0
          ? `${fmtBerat(totalReservasi)} kg ditahan dispatch`
          : `${jumlahJenisSampah} jenis sampah aktif`,
      Icon: Package,
      href: "/admin/jenis-sampah",
    },
    {
      label: "Dispatch Berjalan",
      nilai: String(dispatchPerluTindakan.length),
      sub: `Penjualan selesai ${fmtRupiah(Number(totalNilaiSelesai._sum.totalNilai ?? 0))}`,
      Icon: Truck,
      href: "/admin/transaksi",
    },
  ]

  return (
    <>
      <div className="mb-6">
        <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-2">
          Dashboard
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
          Rekap stock dan transaksi se-kecamatan.
        </p>
      </div>

      {/* Kartu ringkasan */}
      <section
        aria-label="Ringkasan"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
      >
        {kartu.map((k) => (
          <Link
            key={k.label}
            href={k.href}
            className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/50"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <p className="font-label-sm text-label-sm text-on-surface-variant">{k.label}</p>
              <k.Icon className="size-4 text-on-surface-variant" aria-hidden />
            </div>
            <p className="text-headline-md font-mono font-semibold text-on-surface">
              {k.nilai}
            </p>
            {k.sub && (
              <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">{k.sub}</p>
            )}
          </Link>
        ))}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dispatch yang menunggu tindakan */}
        <section className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-outline-variant bg-surface-bright flex items-center justify-between gap-3">
            <h2 className="font-headline-md text-[18px] font-semibold text-on-surface">
              Perlu Tindakan
            </h2>
            <Link
              href="/admin/transaksi"
              className="font-label-sm text-label-sm text-primary hover:underline"
            >
              Semua transaksi
            </Link>
          </div>
          {dispatchPerluTindakan.length === 0 ? (
            <p className="px-5 py-6 font-body-md text-body-md text-on-surface-variant">
              Tidak ada dispatch berjalan.
            </p>
          ) : (
            <ul className="divide-y divide-outline-variant">
              {dispatchPerluTindakan.map((d) => (
                <li key={d.id}>
                  <Link
                    href={`/admin/transaksi/${d.id}`}
                    className="flex items-center justify-between gap-3 px-5 py-3 transition-colors hover:bg-surface-container-low focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/50"
                  >
                    <span className="min-w-0">
                      <span className="block font-label-md text-label-md font-mono text-on-surface truncate">
                        {d.kodeDispatch}
                      </span>
                      <span className="block font-label-sm text-label-sm text-on-surface-variant truncate">
                        {d.bankSampah.nama} → {d.pembeli.nama}
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

        {/* Stock per jenis */}
        <section className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-outline-variant bg-surface-bright">
            <h2 className="font-headline-md text-[18px] font-semibold text-on-surface">
              Stock per Jenis
            </h2>
          </div>
          {jenisTeratas.length === 0 ? (
            <p className="px-5 py-6 font-body-md text-body-md text-on-surface-variant">
              Belum ada stock tercatat.
            </p>
          ) : (
            <ul className="divide-y divide-outline-variant">
              {jenisTeratas.map(([nama, berat]) => (
                <li key={nama} className="flex items-center justify-between gap-3 px-5 py-3">
                  <span className="font-label-md text-label-md text-on-surface truncate">
                    {nama}
                  </span>
                  <span className="font-label-md text-label-md font-mono text-on-surface-variant shrink-0">
                    {fmtBerat(berat)} kg
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Setoran terakhir */}
      <section className="mt-6 bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-outline-variant bg-surface-bright flex items-center justify-between gap-3">
          <h2 className="font-headline-md text-[18px] font-semibold text-on-surface">
            Setoran Terakhir
          </h2>
          <Badge variant="secondary">Transaksi Masuk</Badge>
        </div>
        {setoranTerakhir.length === 0 ? (
          <p className="px-5 py-6 font-body-md text-body-md text-on-surface-variant">
            Belum ada setoran. Setoran dicatat petugas dari bank sampahnya.
          </p>
        ) : (
          <ul className="divide-y divide-outline-variant">
            {setoranTerakhir.map((s) => (
              <li
                key={s.id}
                className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-5 py-3"
              >
                <span className="min-w-0">
                  <span className="block font-label-md text-label-md font-mono text-on-surface">
                    {s.kodeTransaksi}
                  </span>
                  <span className="block font-label-sm text-label-sm text-on-surface-variant truncate">
                    {s.nasabah.nama} · {s.bankSampah.nama}
                  </span>
                </span>
                <span className="font-label-md text-label-md font-mono text-on-surface-variant">
                  {fmtBerat(Number(s.totalBerat))} kg · {fmtRupiah(Number(s.totalNilai))}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}
