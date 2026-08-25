import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CheckCircle2, ChevronRight } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/auth";
import { nasabahTertaut } from "@/lib/nasabah-tertaut";
import {
  KONDISI_SAMPAH_LABEL,
  formatCurrency,
  kondisiStyle,
  type KondisiSampah,
} from "@/lib/setoran-data";

export const metadata: Metadata = {
  title: "Bukti Setor",
};

export const dynamic = "force-dynamic";

const fmtBerat = (n: number) =>
  new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(n);

/**
 * Bukti setor warga — FR-C4. Akses dijaga dua lapis: harus login (middleware)
 * dan setoran yang dibuka wajib milik nasabah yang ditautkan ke akun ini —
 * bukan sekadar satu bank sampah, supaya kode transaksi orang lain tidak bisa
 * ditebak lewat URL.
 */
export default async function BuktiSetoranPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getServerUser();
  if (!user?.bankSampah) redirect("/login");

  // Di sini notFound() memang jawaban yang benar: halaman ini mengungkap satu
  // bukti setor tertentu, jadi akun yang belum tertaut tidak boleh diberi
  // petunjuk apa pun tentang ada/tidaknya setoran itu.
  const taut = await nasabahTertaut({
    noHp: user.noHp,
    bankSampahId: user.bankSampah.id,
  });
  if (taut.status !== "TERTAUT") notFound();
  const nasabah = taut.nasabah;

  const setoran = await prisma.setoran.findFirst({
    where: { id, nasabahId: nasabah.id },
    select: {
      id: true,
      kodeTransaksi: true,
      tanggal: true,
      totalBerat: true,
      totalNilai: true,
      cashDibayar: true,
      bankSampah: { select: { nama: true, alamat: true } },
      petugas: { select: { nama: true } },
      items: {
        select: {
          id: true,
          berat: true,
          hargaSaatItu: true,
          subtotal: true,
          kondisi: true,
          jenisSampah: { select: { nama: true } },
        },
      },
    },
  });
  if (!setoran) notFound();

  return (
    <div className="flex flex-col gap-5">
      {/* Konfirmasi sukses */}
      <div className="flex flex-col items-center gap-2 pt-4 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-primary-container/40">
          <CheckCircle2 className="size-8 text-on-primary-container" aria-hidden />
        </span>
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
          Setoran Tercatat
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Simpan kode ini sebagai bukti — tunai sudah/bisa diambil sesuai status
          pembayaran.
        </p>
      </div>

      <section
        aria-label="Rincian setoran"
        className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest"
      >
        <header className="border-b border-outline-variant bg-surface-bright px-4 py-3">
          <p className="font-mono font-label-md text-label-md text-on-surface">
            {setoran.kodeTransaksi}
          </p>
          <p className="mt-0.5 font-label-sm text-label-sm text-on-surface-variant">
            {setoran.tanggal.toLocaleString("id-ID", {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </header>

        <ul className="divide-y divide-outline-variant">
          {setoran.items.map((item) => (
            <li key={item.id} className="flex items-start justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="font-label-md text-label-md text-on-surface">
                  {item.jenisSampah.nama}
                </p>
                <p className="font-mono font-label-sm text-label-sm text-on-surface-variant">
                  {fmtBerat(Number(item.berat))} kg ×{" "}
                  {formatCurrency(Number(item.hargaSaatItu))}/kg
                </p>
                <span
                  className={`mt-1 inline-block rounded-full border px-2 py-0.5 font-label-sm text-label-sm ${kondisiStyle(item.kondisi as KondisiSampah)}`}
                >
                  {KONDISI_SAMPAH_LABEL[item.kondisi as KondisiSampah]}
                </span>
              </div>
              <p className="shrink-0 font-mono font-label-md text-label-md text-on-surface">
                {formatCurrency(Number(item.subtotal))}
              </p>
            </li>
          ))}
        </ul>

        <footer className="space-y-1 border-t border-outline-variant bg-surface-container-low px-4 py-3">
          <div className="flex items-baseline justify-between">
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              Total berat
            </span>
            <span className="font-mono font-label-md text-label-md text-on-surface">
              {fmtBerat(Number(setoran.totalBerat))} kg
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              Total nilai
            </span>
            <span className="font-mono text-[20px] font-semibold text-primary">
              {formatCurrency(Number(setoran.totalNilai))}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              Pembayaran tunai (BR-04)
            </span>
            {setoran.cashDibayar ? (
              <span className="rounded-full bg-secondary-container px-2 py-0.5 font-label-sm text-label-sm text-on-secondary-container">
                Sudah diserahkan
              </span>
            ) : (
              <span className="rounded-full bg-error-container px-2 py-0.5 font-label-sm text-label-sm text-on-error-container">
                Belum diserahkan
              </span>
            )}
          </div>
          <p className="pt-1 font-label-sm text-label-sm text-on-surface-variant">
            {setoran.bankSampah.nama} · petugas {setoran.petugas.nama}
          </p>
        </footer>
      </section>

      <Link
        href="/aktivitas"
        className="flex h-12 min-h-11 items-center justify-center gap-1 rounded-full bg-primary font-label-md text-label-md font-semibold text-on-primary transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/50"
      >
        Lihat Riwayat Setoran
        <ChevronRight className="size-4" aria-hidden />
      </Link>
    </div>
  );
}
