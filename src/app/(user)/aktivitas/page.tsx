import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, Recycle } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/auth";
import { nasabahTertaut } from "@/lib/nasabah-tertaut";
import { StatusTaut } from "@/components/user/status-taut";

export const metadata: Metadata = {
  title: "Aktivitas",
};

export const dynamic = "force-dynamic";

const fmtBerat = (n: number) =>
  new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(n);

const fmtRupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);

/** Tanggal valid dari query, atau undefined kalau kosong/ngawur. */
function tanggalDari(nilai: string | undefined): Date | undefined {
  if (!nilai) return undefined;
  const d = new Date(nilai);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

/**
 * Riwayat setoran warga — FR-C9 dalam batas miliknya sendiri: hanya setoran
 * nasabah yang tertaut ke akun ini (bukan satu bank sampah penuh seperti
 * panel petugas). Filter tanggal mengikuti pola /admin/laporan — form GET
 * biasa tanpa JavaScript, inklusif sampai akhir hari.
 */
export default async function AktivitasPage({
  searchParams,
}: {
  searchParams: Promise<{ dari?: string; sampai?: string }>;
}) {
  const q = await searchParams;
  const user = await getServerUser();
  if (!user?.bankSampah) redirect("/login");

  // notFound() diganti penjelasan: akun yang belum tertaut bukan URL keliru,
  // dan warga perlu tahu langkah apa yang membuka halaman ini.
  const taut = await nasabahTertaut({
    noHp: user.noHp,
    bankSampahId: user.bankSampah.id,
  });
  if (taut.status !== "TERTAUT") return <StatusTaut hasil={taut} />;
  const nasabah = taut.nasabah;

  const dari = tanggalDari(q.dari);
  const sampai = tanggalDari(q.sampai);
  // Inklusif sampai akhir hari; tanpa ini setoran jam 10 pagi pada tanggal
  // "sampai" terlewat karena dibandingkan dengan 00:00.
  if (sampai) sampai.setHours(23, 59, 59, 999);

  const setoran = await prisma.setoran.findMany({
    where: {
      nasabahId: nasabah.id,
      ...(dari || sampai
        ? { tanggal: { ...(dari && { gte: dari }), ...(sampai && { lte: sampai }) } }
        : {}),
    },
    orderBy: { tanggal: "desc" },
    take: 50,
    select: {
      id: true,
      kodeTransaksi: true,
      tanggal: true,
      totalBerat: true,
      totalNilai: true,
      cashDibayar: true,
      _count: { select: { items: true } },
    },
  });

  const totalBerat = setoran.reduce((a, s) => a + Number(s.totalBerat), 0);
  const totalNilai = setoran.reduce((a, s) => a + Number(s.totalNilai), 0);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
          Aktivitas
        </h1>
        <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
          {setoran.length === 0
            ? "Belum ada setoran pada rentang ini."
            : `${setoran.length} setoran · ${fmtBerat(totalBerat)} kg · ${fmtRupiah(totalNilai)}`}
        </p>
      </div>

      {/* Filter periode — form GET biasa, tanpa JavaScript */}
      <form
        method="get"
        className="flex flex-wrap items-end gap-3 rounded-xl border border-outline-variant bg-surface-container-lowest p-4"
      >
        <div>
          <label
            htmlFor="dari"
            className="mb-1 block font-label-sm text-label-sm text-on-surface-variant"
          >
            Dari tanggal
          </label>
          <input
            id="dari"
            name="dari"
            type="date"
            defaultValue={q.dari ?? ""}
            className="h-11 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 font-body-md text-body-md text-on-surface outline-none focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/50"
          />
        </div>
        <div>
          <label
            htmlFor="sampai"
            className="mb-1 block font-label-sm text-label-sm text-on-surface-variant"
          >
            Sampai tanggal
          </label>
          <input
            id="sampai"
            name="sampai"
            type="date"
            defaultValue={q.sampai ?? ""}
            className="h-11 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 font-body-md text-body-md text-on-surface outline-none focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/50"
          />
        </div>
        <button
          type="submit"
          className="h-11 rounded-lg bg-primary px-4 font-label-md text-label-md font-medium text-on-primary transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/50"
        >
          Terapkan
        </button>
        {(q.dari || q.sampai) && (
          <Link
            href="/aktivitas"
            className="flex h-11 items-center rounded-lg border border-outline-variant px-4 font-label-md text-label-md text-on-surface transition-colors hover:bg-surface-container-low"
          >
            Reset
          </Link>
        )}
      </form>

      {setoran.length === 0 ? (
        <Link
          href="/setor"
          className="flex h-12 items-center justify-center gap-2 rounded-full bg-primary font-label-md text-label-md font-semibold text-on-primary transition-colors hover:bg-primary/90"
        >
          <Recycle className="size-5" aria-hidden />
          Catat Setoran Pertama
        </Link>
      ) : (
        <ul className="space-y-2">
          {setoran.map((s) => (
            <li key={s.id}>
              <Link
                href={`/setoran/${s.id}`}
                className="flex min-h-11 items-center gap-3 rounded-xl border border-outline-variant bg-surface-container-lowest p-4 transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/50"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono font-label-md text-label-md text-on-surface">
                    {s.kodeTransaksi}
                  </p>
                  <p className="font-label-sm text-label-sm text-on-surface-variant truncate">
                    {s._count.items} item ·{" "}
                    {s.tanggal.toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                  {!s.cashDibayar && (
                    <p className="mt-0.5 font-label-sm text-label-sm text-error">
                      Tunai belum diserahkan
                    </p>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-mono font-label-md text-label-md text-on-surface">
                    {fmtRupiah(Number(s.totalNilai))}
                  </p>
                  <p className="font-mono font-label-sm text-label-sm text-on-surface-variant">
                    {fmtBerat(Number(s.totalBerat))} kg
                  </p>
                </div>
                <ChevronRight className="size-4 shrink-0 text-on-surface-variant" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
