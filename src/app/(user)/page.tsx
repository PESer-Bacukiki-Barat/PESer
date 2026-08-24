import Link from "next/link";
import {
  ArrowUpRight,
  ChevronRight,
  Coins,
  History,
  Leaf,
  Recycle,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const QUICK_ACTIONS = [
  {
    label: "Setor Sampah",
    href: "/setor",
    icon: Recycle,
    variant: "primary",
  },
  {
    label: "Riwayat",
    href: "/aktivitas",
    icon: History,
    variant: "muted",
  },
  {
    label: "Dompet",
    href: "/dompet",
    icon: Coins,
    variant: "muted",
  },
];

const AKTIVITAS = [
  {
    id: 1,
    label: "Setor Plastik",
    detail: "2.4 kg · Bersih",
    date: "Hari ini, 09:12",
    nilai: "Rp 4.800",
  },
  {
    id: 2,
    label: "Setor Kertas",
    detail: "1.2 kg · Campur",
    date: "Kemarin, 14:30",
    nilai: "Rp 1.800",
  },
  {
    id: 3,
    label: "Setor Logam",
    detail: "0.8 kg · Bersih",
    date: "12 Agu 2026",
    nilai: "Rp 3.200",
  },
];

export default function HomePage() {
  return (
    <>
      <header className="flex items-center justify-between px-4 pt-6 pb-2">
        <div>
          <p className="text-sm text-muted-foreground">Selamat datang,</p>
          <h1 className="font-heading text-headline-md text-primary">
            Budi Santoso
          </h1>
        </div>
        <div className="flex size-10 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
          <Leaf className="size-5" />
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-6 px-4 pb-24">
        <Card className="border-none bg-gradient-to-br from-primary to-secondary text-primary-foreground shadow-md">
          <CardContent className="flex flex-col gap-4 py-5">
            <div className="flex items-center gap-2 text-primary-foreground/80">
              <Sparkles className="size-4" />
              <p className="text-sm">Saldo &amp; Poin Anda</p>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="font-mono text-3xl font-medium tracking-tight">
                  Rp 24.800
                </p>
                <p className="mt-1 text-xs text-primary-foreground/70">
                  Saldo siap tarik
                </p>
              </div>
              <div className="rounded-full bg-primary-foreground/15 px-3 py-1.5 text-right">
                <p className="font-mono text-sm font-medium">1.240</p>
                <p className="text-[11px] text-primary-foreground/70">Poin</p>
              </div>
            </div>
            <Link
              href="/dompet"
              className="mt-1 inline-flex w-fit items-center gap-1 text-sm font-medium underline-offset-4 hover:underline"
            >
              Lihat dompet
              <ArrowUpRight className="size-4" />
            </Link>
          </CardContent>
        </Card>

        <section aria-labelledby="quick-action-title">
          <h2
            id="quick-action-title"
            className="mb-3 font-heading text-sm font-semibold text-foreground"
          >
            Aksi Cepat
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {QUICK_ACTIONS.map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl p-4 text-center text-sm font-medium transition-all active:scale-95",
                  action.variant === "primary"
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "border border-border bg-card text-foreground hover:bg-muted"
                )}
              >
                <action.icon className="size-6" />
                {action.label}
              </Link>
            ))}
          </div>
        </section>

        <section aria-labelledby="activity-title">
          <div className="mb-3 flex items-center justify-between">
            <h2
              id="activity-title"
              className="font-heading text-sm font-semibold text-foreground"
            >
              Aktivitas Terbaru
            </h2>
            <Link
              href="/aktivitas"
              className="inline-flex items-center gap-0.5 text-sm font-medium text-primary"
            >
              Lihat semua
              <ChevronRight className="size-4" />
            </Link>
          </div>
          <Card className="divide-y divide-border">
            {AKTIVITAS.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {item.label}
                  </p>
                  <p className="font-mono text-xs text-muted-foreground">
                    {item.detail} · {item.date}
                  </p>
                </div>
                <p className="shrink-0 font-mono text-sm font-semibold text-primary">
                  {item.nilai}
                </p>
              </div>
            ))}
          </Card>
        </section>

        <Button
          className="mt-auto h-12 w-full rounded-full text-lg font-semibold"
          render={<Link href="/setor" />}
          nativeButton={false}
        >
          Mulai Setor Sampah
        </Button>
      </main>
    </>
  );
}
