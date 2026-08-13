import { Filter, Recycle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const TABS = ["Semua", "Masuk", "Tarik"];

const RIWAYAT = [
  {
    id: 1,
    label: "Setor Plastik",
    detail: "2.4 kg · Bersih",
    date: "Hari ini, 09:12",
    nilai: "+Rp 4.800",
    masuk: true,
  },
  {
    id: 2,
    label: "Setor Kertas",
    detail: "1.2 kg · Campur",
    date: "Kemarin, 14:30",
    nilai: "+Rp 1.800",
    masuk: true,
  },
  {
    id: 3,
    label: "Setor Logam",
    detail: "0.8 kg · Bersih",
    date: "12 Agu 2026",
    nilai: "+Rp 3.200",
    masuk: true,
  },
  {
    id: 4,
    label: "Tarik Tunai",
    detail: "Transfer ke BCA ••• 1234",
    date: "10 Agu 2026",
    nilai: "-Rp 15.000",
    masuk: false,
  },
];

export default function AktivitasPage() {
  return (
    <>
      <header className="flex items-center justify-between px-4 pt-6 pb-2">
        <h1 className="font-heading text-headline-md text-primary">
          Aktivitas
        </h1>
        <Button variant="outline" size="icon-lg" className="rounded-full">
          <Filter />
          <span className="sr-only">Filter</span>
        </Button>
      </header>

      <main className="flex flex-1 flex-col gap-4 px-4 pb-24">
        <div
          role="tablist"
          aria-label="Filter aktivitas"
          className="grid grid-cols-3 gap-1 rounded-lg border border-border bg-muted p-1"
        >
          {TABS.map((tab, index) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={index === 0}
              className={cn(
                "rounded-md py-1.5 text-center font-mono text-sm font-medium transition-all",
                index === 0
                  ? "bg-card text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          {RIWAYAT.map((item) => (
            <Card key={item.id} size="sm">
              <div className="flex items-center gap-3 px-3 py-3">
                <div
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-full",
                    item.masuk
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <Recycle className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {item.label}
                  </p>
                  <p className="font-mono text-xs text-muted-foreground">
                    {item.detail} · {item.date}
                  </p>
                </div>
                <p
                  className={cn(
                    "shrink-0 font-mono text-sm font-semibold",
                    item.masuk ? "text-primary" : "text-destructive"
                  )}
                >
                  {item.nilai}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </main>
    </>
  );
}
