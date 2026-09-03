import Link from "next/link"
import type { Metadata } from "next";
import { ChevronRight } from "lucide-react";

import TransaksiTabs from "@/app/admin/transaksi/transaksi-tabs";
import { prisma } from "@/lib/prisma";
import type { Dispatch, DispatchStatus } from "@/lib/dispatch-data";
import type { KondisiSampah, Setoran } from "@/lib/setoran-data";

export const metadata: Metadata = {
  title: "Manajemen Transaksi",
};

export const dynamic = "force-dynamic";

export default async function TransaksiPage() {
  const [dispatchRows, setoranRows, bankSampahRows, pembeliRows, jenisSampahRows] =
    await Promise.all([
      prisma.dispatch.findMany({
        where: { deletedAt: null },
        orderBy: { tanggalJemput: "desc" },
        include: {
          bankSampah: { select: { nama: true } },
          pembeli: { select: { nama: true } },
          items: { include: { jenisSampah: { select: { nama: true } } } },
        },
      }),
      prisma.setoran.findMany({
        orderBy: { tanggal: "desc" },
        include: {
          bankSampah: { select: { nama: true } },
          nasabah: { select: { nama: true } },
          petugas: { select: { nama: true } },
          items: { include: { jenisSampah: { select: { nama: true } } } },
        },
      }),
      prisma.bankSampah.findMany({
        where: { deletedAt: null, isActive: true },
        orderBy: { nama: "asc" },
        select: { id: true, nama: true },
      }),
      prisma.pembeli.findMany({
        where: { deletedAt: null, isActive: true },
        orderBy: { nama: "asc" },
        select: { id: true, nama: true },
      }),
      prisma.jenisSampah.findMany({
        where: { deletedAt: null, isActive: true },
        orderBy: { nama: "asc" },
        select: { id: true, nama: true },
      }),
    ]);

  // Decimal dan DateTime tidak serializable ke Client Component — konversi dulu.
  const dispatches: Dispatch[] = dispatchRows.map((d) => ({
    id: d.id,
    kodeDispatch: d.kodeDispatch,
    bankSampah: d.bankSampah.nama,
    bankSampahId: d.bankSampahId,
    pembeli: d.pembeli.nama,
    pembeliId: d.pembeliId,
    status: d.status as DispatchStatus,
    tanggalJemput: d.tanggalJemput.toISOString(),
    totalNilai: d.totalNilai === null ? null : Number(d.totalNilai),
    alasanTolak: d.alasanTolak,
    alasanSelisih: d.alasanSelisih,
    selisihSignifikan: d.selisihSignifikan,
    items: d.items.map((i) => ({
      id: i.id,
      jenisSampah: i.jenisSampah.nama,
      jenisSampahId: i.jenisSampahId,
      beratTarget: Number(i.beratTarget),
      beratAktual: i.beratAktual === null ? null : Number(i.beratAktual),
      hargaJualPerKg: Number(i.hargaJualPerKg),
      subtotal: i.subtotal === null ? null : Number(i.subtotal),
    })),
  }));

  const setorans: Setoran[] = setoranRows.map((s) => ({
    id: s.id,
    kodeTransaksi: s.kodeTransaksi,
    bankSampah: s.bankSampah.nama,
    bankSampahId: s.bankSampahId,
    nasabah: s.nasabah.nama,
    nasabahId: s.nasabahId,
    petugas: s.petugas.nama,
    petugasId: s.petugasId,
    totalBerat: Number(s.totalBerat),
    totalNilai: Number(s.totalNilai),
    cashDibayar: s.cashDibayar,
    tanggal: s.tanggal.toISOString(),
    idempotencyKey: s.idempotencyKey,
    items: s.items.map((i) => ({
      id: i.id,
      jenisSampah: i.jenisSampah.nama,
      jenisSampahId: i.jenisSampahId,
      berat: Number(i.berat),
      hargaSaatItu: Number(i.hargaSaatItu),
      subtotal: Number(i.subtotal),
      kondisi: i.kondisi as KondisiSampah,
    })),
  }));

  const options = {
    bankSampah: bankSampahRows.map((b) => ({ value: b.id, label: b.nama })),
    pembeli: pembeliRows.map((p) => ({ value: p.id, label: p.nama })),
    jenisSampah: jenisSampahRows.map((j) => ({ value: j.id, label: j.nama })),
  };

  return (
    <>
      {/* Breadcrumbs */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-2 text-on-surface-variant font-label-sm text-label-sm mb-6"
      >
        <Link className="tekan-halus hover:text-primary" href="/admin">
          Dashboard
        </Link>
        <ChevronRight className="size-4" aria-hidden />
        <span className="text-on-surface font-semibold">Manajemen Transaksi</span>
      </nav>

      {/* Header */}
      <div className="mb-6">
        <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-2">
          Manajemen Transaksi
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
          Kelola transaksi masuk (Setoran) dan keluar (Dispatch).
        </p>
      </div>

      <TransaksiTabs
        dispatches={dispatches}
        setorans={setorans}
        options={options}
      />
    </>
  );
}
