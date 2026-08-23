import Link from "next/link";
import {
  ChevronRight,
  CircleUserRound,
  FileText,
  HelpCircle,
  Settings,
  ShieldCheck,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const MENU = [
  { label: "Riwayat Transaksi", href: "/aktivitas", icon: FileText },
  { label: "Bantuan", href: "/", icon: HelpCircle },
  { label: "Kebijakan Privasi", href: "/", icon: ShieldCheck },
  { label: "Pengaturan", href: "/", icon: Settings },
];

export default function ProfilPage() {
  return (
    <>
      <header className="px-4 pt-6 pb-2">
        <h1 className="font-heading text-headline-md text-primary">Profil</h1>
      </header>

      <main className="flex flex-1 flex-col gap-6 px-4 pb-24">
        <Card className="bg-gradient-to-br from-secondary to-primary text-primary-foreground shadow-md">
          <div className="flex items-center gap-4 px-4 py-5">
            <div className="flex size-14 items-center justify-center rounded-full bg-primary-foreground/15">
              <CircleUserRound className="size-8" />
            </div>
            <div className="min-w-0">
              <p className="font-heading text-base font-semibold">
                Budi Santoso
              </p>
              <p className="font-mono text-xs text-primary-foreground/80">
                Member ID · PES-2026-0184
              </p>
              <p className="font-mono text-xs text-primary-foreground/80">
                0812-3456-7890
              </p>
            </div>
          </div>
        </Card>

        <Card className="divide-y divide-border">
          {MENU.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted"
            >
              <div
                className={cn(
                  "flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary"
                )}
              >
                <item.icon className="size-4" />
              </div>
              <span className="flex-1 text-sm font-medium text-foreground">
                {item.label}
              </span>
              <ChevronRight className="size-4 text-muted-foreground" />
            </Link>
          ))}
        </Card>

        <p className="text-center font-mono text-xs text-muted-foreground">
          PESer v0.1.0 · Waste is Value
        </p>
      </main>
    </>
  );
}
