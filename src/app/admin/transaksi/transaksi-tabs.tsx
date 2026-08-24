"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Inbox, Truck } from "lucide-react";

import { DispatchTable } from "@/components/admin/dispatch-table";
import { SetoranTable } from "@/components/admin/setoran-table";
import type { Dispatch, DispatchFormOptions } from "@/lib/dispatch-data";
import type { Setoran } from "@/lib/setoran-data";
import { exportToCsv } from "@/lib/export";
import { cn } from "@/lib/utils";

type Tab = "dispatch" | "setoran";

export default function TransaksiTabs({
  dispatches,
  setorans,
  options,
}: {
  dispatches: Dispatch[];
  setorans: Setoran[];
  options: DispatchFormOptions;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("setoran");

  function exportSetoran() {
    const rows = setorans.map((s, i) => ({
      no: i + 1,
      kodeTransaksi: s.kodeTransaksi,
      tanggal: s.tanggal,
      bankSampah: s.bankSampah,
      nasabah: s.nasabah,
      petugas: s.petugas,
      totalBerat: s.totalBerat,
      totalNilai: s.totalNilai,
      pembayaran: s.cashDibayar ? "Lunas" : "Belum",
      jumlahItem: s.items.length,
    }));
    exportToCsv("transaksi-setoran", rows, [
      { key: "no", label: "No" },
      { key: "kodeTransaksi", label: "Kode Transaksi" },
      { key: "tanggal", label: "Tanggal" },
      { key: "bankSampah", label: "Bank Sampah" },
      { key: "nasabah", label: "Nasabah" },
      { key: "petugas", label: "Petugas" },
      { key: "totalBerat", label: "Total Berat (kg)" },
      { key: "totalNilai", label: "Total Nilai" },
      { key: "pembayaran", label: "Pembayaran" },
      { key: "jumlahItem", label: "Jumlah Item" },
    ]);
  }

  function exportDispatch() {
    const rows = dispatches.map((d, i) => ({
      no: i + 1,
      kodeDispatch: d.kodeDispatch,
      bankSampah: d.bankSampah,
      pembeli: d.pembeli,
      status: d.status,
      tanggalJemput: d.tanggalJemput,
      totalNilai: d.totalNilai ?? 0,
      selisihSignifikan: d.selisihSignifikan ? "Ya" : "Tidak",
    }));
    exportToCsv("transaksi-dispatch", rows, [
      { key: "no", label: "No" },
      { key: "kodeDispatch", label: "Kode Dispatch" },
      { key: "bankSampah", label: "Bank Sampah" },
      { key: "pembeli", label: "Pembeli" },
      { key: "status", label: "Status" },
      { key: "tanggalJemput", label: "Tgl Jemput" },
      { key: "totalNilai", label: "Total Nilai" },
      { key: "selisihSignifikan", label: "Selisih Signifikan" },
    ]);
  }

  const tabs: {
    id: Tab;
    label: string;
    Icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: "dispatch", label: "Transaksi Keluar", Icon: Truck },
    { id: "setoran", label: "Transaksi Masuk", Icon: Inbox },
  ];

  return (
    <>
      {/* Segmented Tab Control */}
      <div className="flex items-center justify-between mb-stack-lg">
        <nav
          aria-label="Tabs"
          className="inline-flex items-center gap-1 p-1.5 text-white bg-surface-container-high rounded-full border border-outline-variant"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              aria-current={activeTab === tab.id ? "page" : undefined}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center justify-center gap-2 px-5 py-2.5 rounded-full font-headline-md text-[15px] font-semibold transition-all duration-200",
                activeTab === tab.id
                  ? "bg-primary text-on-primary shadow-md"
                  : "text-on-surface-variant hover:text-on-surface hover:bg-green-200 transition-all duration-200",
              )}
            >
              <tab.Icon className="size-5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {activeTab === "setoran" && (
        <section className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-outline-variant bg-surface-bright flex items-start justify-between">
            <div>
              <h2 className="font-headline-md text-[20px] font-semibold text-on-surface">
                Transaksi Masuk (Setoran)
              </h2>
              <p className="font-body-md text-sm text-on-surface-variant mt-1">
                Daftar setoran sampah dari nasabat (read-only). Admin hanya dapat
                melihat dan mengekspor data.
              </p>
            </div>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full font-label-sm text-label-sm bg-secondary-container text-on-secondary-container border border-secondary/20">
              Read-Only
            </span>
          </div>
          <SetoranTable
            setorans={setorans}
            onExport={exportSetoran}
            onView={() => {}}
          />
        </section>
      )}

      {activeTab === "dispatch" && (
        <section className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-outline-variant bg-surface-bright flex items-start justify-between">
            <div>
              <h2 className="font-headline-md text-[20px] font-semibold text-on-surface">
                Transaksi Keluar (Dispatch)
              </h2>
              <p className="font-body-md text-sm text-on-surface-variant mt-1">
                Daftar pengiriman sampah ke pembeli (pengepul).
              </p>
            </div>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full font-label-sm text-label-sm bg-tertiary-container text-on-tertiary-container border border-tertiary/30">
              Terkelola
            </span>
          </div>
          <DispatchTable
            dispatches={dispatches}
            options={options}
            onExport={exportDispatch}
            onView={(d) => router.push(`/admin/transaksi/${d.id}`)}
          />
        </section>
      )}
    </>
  );
}
