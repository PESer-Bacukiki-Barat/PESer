"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { DispatchForm } from "@/components/admin/dispatch-form";
import { api, apiError } from "@/lib/api";
import type { DispatchFormOptions, DispatchFormValues } from "@/lib/dispatch-data";

export function TambahDispatchForm({ options }: { options: DispatchFormOptions }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(values: DispatchFormValues) {
    setIsSubmitting(true);
    setError(null);
    try {
      const now = new Date();
      await api.post("/dispatch", {
        kodeDispatch: `DSP-${now.getFullYear()}${String(
          now.getMonth() + 1,
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
      {error && (
        <div className="mb-6 p-4 bg-error-container/10 border border-error rounded-lg">
          <p className="text-error font-label-md text-label-md">{error}</p>
        </div>
      )}

      <DispatchForm
        bankSampahOptions={options.bankSampah}
        pembeliOptions={options.pembeli}
        jenisSampahOptions={options.jenisSampah}
        submitLabel={isSubmitting ? "Menyimpan..." : "Simpan Dispatch"}
        cancelLabel="Batal"
        cancelHref="/admin/transaksi"
        onSubmit={handleSubmit}
        menyimpan={isSubmitting}
        onCancel={() => router.push("/admin/transaksi")}
      />
    </>
  );
}
