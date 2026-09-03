import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Recycle, Scale, Wallet } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/auth";
import { nasabahTertaut } from "@/lib/nasabah-tertaut";
import { StatusTaut } from "@/components/user/status-taut";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fmtBerat, fmtRupiah, fmtTanggalPendek } from "@/lib/format";

export const metadata: Metadata = {
  title: "Beranda",
};

export const dynamic = "force-dynamic";

/**
 * Beranda warga — rekap setoran miliknya di bank sampah tempat akunnya
 * ditugaskan.
 *
 * PRD tidak punya saldo/poin untuk warga (§1.3), jadi kartu utama menampilkan
 * dua angka yang benar-benar ada di skema: total berat dan total nilai
 * setoran. Angka bulan ini dihitung dari tanggal 1 bulan berjalan.
 */
export default async function HomePage() {
  const user = await getServerUser();
  if (!user?.bankSampah) redirect("/login");
  const bankSampahId = user.bankSampah.id;

  // Penautan akun ke nasabah lewat noHp yang sama di bank sampah itu (§1.3
  // tidak membuat akun warga). Kalau tautannya tidak pasti, halaman berhenti di
  // sini: menampilkan angka milik nasabah lain jauh lebih buruk daripada
  // menampilkan penjelasan.
  const taut = await nasabahTertaut({ noHp: user.noHp, bankSampahId });
  if (taut.status !== "TERTAUT") return <StatusTaut hasil={taut} />;
  const nasabah = taut.nasabah;

  const awalBulan = new Date();
  awalBulan.setDate(1);
  awalBulan.setHours(0, 0, 0, 0);

  // where kosong (bukan {id:""}) saat nasabah belum ditemukan — aggregate
  // tetap sah dan hasilnya nol tanpa cabang khusus.
  const whereNasabah = nasabah ? { nasabahId: nasabah.id } : { id: { in: [] } };

  const [aggBulan, aggTotal, terakhir] = await Promise.all([
    prisma.setoran.aggregate({
      where: { ...whereNasabah, tanggal: { gte: awalBulan } },
      _sum: { totalBerat: true, totalNilai: true },
      _count: true,
    }),
    prisma.setoran.aggregate({
      where: whereNasabah,
      _sum: { totalBerat: true, totalNilai: true },
      _count: true,
    }),
    nasabah
      ? prisma.setoran.findMany({
          where: { nasabahId: nasabah.id },
          orderBy: { tanggal: "desc" },
          take: 3,
          select: {
            id: true,
            kodeTransaksi: true,
            tanggal: true,
            totalBerat: true,
            totalNilai: true,
            items: { select: { id: true, jenisSampah: { select: { nama: true } } } },
          },
        })
      : Promise.resolve([]),
  ]);

  return (
    <div className="flex flex-col gap-6">
      {/* Kartu utama — Secondary/Forest sebagai deep background (DESIGN.md) */}
      <Card className="border-none bg-gradient-to-br from-secondary to-primary text-on-primary shadow-md">
        <CardContent className="flex flex-col gap-4 py-5">
          <div className="flex items-center gap-2 text-on-primary/80">
            <Recycle className="size-4" aria-hidden />
            <p className="font-label-md text-label-md">Setoran Saya</p>
          </div>
          <dl className="grid grid-cols-2 gap-4">
            <div>
              <dt className="font-label-sm text-label-sm text-on-primary/70">Berat total</dt>
              <dd className="mt-1 font-mono text-headline-md tabular-nums tracking-tight">
                {fmtBerat(Number(aggTotal._sum.totalBerat ?? 0))}
                <span className="ml-1 font-label-sm text-label-sm font-normal">kg</span>
              </dd>
            </div>
            <div>
              <dt className="font-label-sm text-label-sm text-on-primary/70">Nilai setoran</dt>
              <dd className="mt-1 font-mono text-headline-md tabular-nums tracking-tight">
                {fmtRupiah(Number(aggTotal._sum.totalNilai ?? 0))}
              </dd>
            </div>
          </dl>
          <p className="font-label-sm text-label-sm text-on-primary/70">
            Bulan ini: {aggBulan._count}× setor ·{" "}
            {fmtBerat(Number(aggBulan._sum.totalBerat ?? 0))} kg ·{" "}
            {fmtRupiah(Number(aggBulan._sum.totalNilai ?? 0))} — dibayar tunai oleh
            petugas (BR-04)
          </p>
        </CardContent>
      </Card>

      {!nasabah && (
        <p className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4 font-body-md text-body-md text-on-surface-variant">
          Nomor HP Anda belum terdaftar sebagai nasabah bank sampah ini, jadi belum
          ada setoran yang bisa ditautkan. Datang ke pos bank sampah dengan membawa
          nomor HP untuk pendaftaran.
        </p>
      )}

      {/* Aksi cepat — satu-satunya alur adalah setor + riwayat (PRD §1.3) */}
      <section aria-labelledby="quick-action-title">
        <h2
          id="quick-action-title"
          className="mb-3 text-title-sm text-on-surface"
        >
          Aksi Cepat
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/setor"
            className="flex min-h-20 flex-col justify-between rounded-xl bg-primary p-4 text-on-primary shadow-md transition-transform active:scale-[0.98]"
          >
            <Recycle className="size-5" aria-hidden />
            <span className="font-label-md text-label-md font-semibold">Setor Sampah</span>
          </Link>
          <Link
            href="/aktivitas"
            className="flex min-h-20 flex-col justify-between rounded-xl border border-outline-variant bg-surface-container-lowest p-4 text-on-surface transition-transform active:scale-[0.98]"
          >
            <Wallet className="size-5 text-primary" aria-hidden />
            <span className="font-label-md text-label-md font-semibold">Riwayat Setoran</span>
          </Link>
        </div>
      </section>

      <section aria-labelledby="activity-title">
        <div className="mb-3 flex items-center justify-between">
          <h2
            id="activity-title"
            className="text-title-sm text-on-surface"
          >
            Setoran Terakhir
          </h2>
          <Link
            href="/aktivitas"
            className="inline-flex min-h-11 items-center gap-1 font-label-md text-label-md font-medium text-primary"
          >
            Lihat semua
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>

        {terakhir.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-8 text-center">
              <Scale className="size-8 text-on-surface-variant" aria-hidden />
              <p className="font-body-md text-body-md text-on-surface-variant">
                Belum ada setoran tercatat.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="divide-y divide-outline-variant">
            {terakhir.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate font-body-md text-body-md text-on-surface">
                    {s.items.map((i) => i.jenisSampah.nama).join(", ") || "Setoran"}
                  </p>
                  <p className="font-mono font-label-sm text-label-sm text-on-surface-variant">
                    {fmtTanggalPendek(s.tanggal)}{" "}
                    · {fmtBerat(Number(s.totalBerat))} kg · {s.kodeTransaksi}
                  </p>
                </div>
                <p className="shrink-0 font-mono font-label-md text-label-md font-semibold text-primary">
                  {fmtRupiah(Number(s.totalNilai))}
                </p>
              </div>
            ))}
          </Card>
        )}
      </section>

      <Button
        className="mt-auto h-12 w-full rounded-full font-label-md text-label-md font-semibold"
        render={<Link href="/setor" />}
        nativeButton={false}
      >
        Mulai Setor Sampah
      </Button>
    </div>
  );
}
