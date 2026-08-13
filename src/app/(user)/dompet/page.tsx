import { ArrowDownToLine, ArrowUpFromLine, BadgeCheck, Coins } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function DompetPage() {
  return (
    <>
      <header className="px-4 pt-6 pb-2">
        <h1 className="font-heading text-headline-md text-primary">Dompet</h1>
        <p className="text-sm text-muted-foreground">
          Kelola saldo dan poin Anda
        </p>
      </header>

      <main className="flex flex-1 flex-col gap-6 px-4 pb-24">
        <Card className="border-none bg-gradient-to-br from-primary to-secondary text-primary-foreground shadow-md">
          <CardContent className="flex flex-col gap-5 py-6">
            <p className="text-sm text-primary-foreground/80">
              Total Saldo
            </p>
            <p className="font-mono text-4xl font-medium tracking-tight">
              Rp 24.800
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Button
                className="h-11 gap-2 rounded-full bg-primary-foreground text-primary hover:bg-primary-foreground/90"
              >
                <ArrowUpFromLine className="size-4" />
                Tarik Tunai
              </Button>
              <Button
                className="h-11 gap-2 rounded-full border border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
              >
                <ArrowDownToLine className="size-4" />
                Top Up
              </Button>
            </div>
          </CardContent>
        </Card>

        <section aria-labelledby="poin-title">
          <h2
            id="poin-title"
            className="mb-3 font-heading text-sm font-semibold text-foreground"
          >
            Poin &amp; Reward
          </h2>
          <Card>
            <CardContent className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                  <Coins className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Total Poin
                  </p>
                  <p className="font-mono text-xs text-muted-foreground">
                    Tukarkan jadi saldo &amp; reward
                  </p>
                </div>
              </div>
              <p className="font-mono text-lg font-semibold text-primary">
                1.240
              </p>
            </CardContent>
          </Card>
        </section>

        <section aria-labelledby="sertifikat-title">
          <h2
            id="sertifikat-title"
            className="mb-3 font-heading text-sm font-semibold text-foreground"
          >
            Sertifikat Digital
          </h2>
          <Card>
            <CardContent className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex size-10 items-center justify-center rounded-full",
                    "bg-primary/10 text-primary"
                  )}
                >
                  <BadgeCheck className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Karbon Tersimpan
                  </p>
                  <p className="font-mono text-xs text-muted-foreground">
                    Sertifikat #PES-2026-0184
                  </p>
                </div>
              </div>
              <p className="font-mono text-lg font-semibold text-primary">
                3.2 kg
              </p>
            </CardContent>
          </Card>
        </section>
      </main>
    </>
  );
}
