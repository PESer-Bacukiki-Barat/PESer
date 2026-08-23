"use client";

import { ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";

import { DispatchForm } from "@/components/admin/dispatch-form";
import { api, apiError } from "@/lib/api";
import { useState } from "react";
import { type DispatchFormValues } from "@/lib/dispatch-data";

export default function TambahDispatchPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(values: DispatchFormValues) {
    setIsSubmitting(true);
    setError(null);
    try {
      await api.post("/api/dispatch", {
        kodeDispatch: `DSP-${new Date().getFullYear()}${String(
          new Date().getMonth() + 1,
        ).padStart(2, "0")}-${Math.floor(Math.random() * 1000)
          .toString()
          .padStart(3, "0")}`,
        bankSampahId: values.bankSampahId,
        pembeliId: values.pembeliId,
        tanggalJemput: new Date(values.tanggalJemput).toISOString(),
        items: values.items.map((i) => ({
          jenisSampahId: i.jenisSampahId,
          beratTarget: parseFloat(i.beratTarget),
          hargaJualPerKg: parseFloat(i.hargaJualPerKg),
        })),
        alasan: values.alasan || undefined,
      });
      router.push("/admin/transaksi");
    } catch (e) {
      setError(apiError(e));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      {/* Breadcrumbs */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-2 text-on-surface-variant font-label-sm text-label-sm mb-6"
      >
        <a className="hover:text-primary transition-colors" href="/admin">
          Dashboard
        </a>
        <ChevronRight className="size-4" />
        <a
          className="hover:text-primary transition-colors"
          href="/admin/transaksi"
        >
          Manajemen Transaksi
        </a>
        <ChevronRight className="size-4" />
        <span className="text-on-surface font-semibold">Tambah Dispatch</span>
      </nav>

      {/* Header */}
      <div className="mb-6">
        <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-2">
          Tambah Dispatch
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
          Buat dispatch baru untuk pengiriman sampah ke pembeli (pengepul).
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-error-container/10 border border-error rounded-lg">
          <p className="text-error font-label-md text-label-md">{error}</p>
        </div>
      )}

      <DispatchForm
        submitLabel={isSubmitting ? "Menyimpan..." : "Simpan Dispatch"}
        cancelLabel="Batal"
        cancelHref="/admin/transaksi"
        onSubmit={handleSubmit}
        onCancel={() => router.push("/admin/transaksi")}
      />
    </>
  );
}
