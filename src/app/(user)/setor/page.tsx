"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const HARI_PER_KG: Record<string, number> = {
  plastik: 2000,
  kertas: 1500,
  logam: 4000,
  kaca: 800,
};

const KONDISI: { value: string; label: string }[] = [
  { value: "bersih", label: "Bersih" },
  { value: "campur", label: "Campur" },
  { value: "kotor", label: "Kotor" },
];

export default function SetorSampahPage() {
  const [kategori, setKategori] = useState("");
  const [berat, setBerat] = useState("");
  const [kondisi, setKondisi] = useState("bersih");

  const estimasi = (() => {
    const harga = HARI_PER_KG[kategori] ?? 0;
    const kg = parseFloat(berat);
    if (isNaN(kg) || kg <= 0) return 0;
    return Math.round(kg * harga);
  })();

  return (
    <>
      <header className="flex h-16 w-full items-center justify-between border-b border-border bg-background px-4">
        <Button
          variant="ghost"
          size="icon-lg"
          className="rounded-full"
          render={<Link href="/" />}
          nativeButton={false}
        >
          <ArrowLeft />
          <span className="sr-only">Kembali</span>
        </Button>
        <h1 className="font-heading text-headline-md text-primary">Setor Sampah</h1>
        <div className="w-10" aria-hidden="true" />
      </header>

      <main className="mx-auto w-full max-w-md flex-1 px-4 py-6">
        <Card>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="kategori">Jenis Sampah</Label>
              <Select
                value={kategori}
                onValueChange={(value) => setKategori(value ?? "")}
              >
                <SelectTrigger id="kategori" className="h-10 w-full">
                  <SelectValue placeholder="Pilih jenis sampah..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="plastik">Plastik (Botol, Gelas, Kantong)</SelectItem>
                  <SelectItem value="kertas">Kertas &amp; Kardus</SelectItem>
                  <SelectItem value="logam">Logam (Kaleng, Besi)</SelectItem>
                  <SelectItem value="kaca">Kaca (Botol Beling)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="berat">Berat Sampah</Label>
              <div className="relative">
                <Input
                  id="berat"
                  type="number"
                  step="0.1"
                  placeholder="0.0"
                  className="h-10 pr-10 text-right font-mono"
                  value={berat}
                  onChange={(e) => setBerat(e.target.value)}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-sm text-muted-foreground">
                  kg
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Estimasi nilai:{" "}
                <span className="font-mono font-medium text-primary">
                  Rp {estimasi.toLocaleString("id-ID")}
                </span>
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Kondisi Sampah</Label>
              <div
                role="radiogroup"
                aria-label="Kondisi Sampah"
                className="grid grid-cols-3 gap-1 rounded-lg border border-border bg-muted p-1"
              >
                {KONDISI.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    role="radio"
                    aria-checked={kondisi === item.value}
                    onClick={() => setKondisi(item.value)}
                    className={cn(
                      "rounded-md py-1.5 text-center font-mono text-sm font-medium transition-all",
                      kondisi === item.value
                        ? "bg-card text-primary shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="catatan">Catatan Tambahan (Opsional)</Label>
              <Textarea
                id="catatan"
                rows={3}
                placeholder="Misal: Ada beberapa kaleng cat campur..."
                className="resize-none"
              />
            </div>
          </CardContent>
        </Card>

        <Button className="mt-6 h-12 w-full gap-2 rounded-full text-lg font-semibold">
          <CheckCircle2 className="size-5" />
          Submit Setoran
        </Button>
      </main>
    </>
  );
}
