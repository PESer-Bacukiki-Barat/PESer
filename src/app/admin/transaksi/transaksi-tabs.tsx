"use client";

import { useEffect, useState } from "react";
import { Inbox, Truck } from "lucide-react";

import { api, apiError } from "@/lib/api";
import { DispatchTable } from "@/components/admin/dispatch-table";
import { SetoranTable } from "@/components/admin/setoran-table";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { Dispatch, DispatchItem } from "@/lib/dispatch-data";
import type { KondisiSampah, Setoran, SetoranItem } from "@/lib/setoran-data";
import { exportToCsv } from "@/lib/export";
import { cn } from "@/lib/utils";

type Tab = "dispatch" | "setoran";

type RawSetoran = {
  id: string;
  kodeTransaksi: string;
  bankSampahId: string;
  bankSampah?: { nama: string } | null;
  nasabahId: string;
  nasabah?: { nama: string } | null;
  petugasId: string;
  petugas?: { nama: string } | null;
  totalBerat: string | number;
  totalNilai: string | number;
  cashDibayar: boolean;
  tanggal: string;
  idempotencyKey: string;
  items?: RawSetoranItem[];
};

type RawSetoranItem = {
  id: string;
  jenisSampahId: string;
  jenisSampah?: { nama: string } | null;
  berat: string | number;
  hargaSaatItu: string | number;
  subtotal: string | number;
  kondisi: KondisiSampah;
};

type RawDispatch = {
  id: string;
  kodeDispatch: string;
  bankSampahId: string;
  bankSampah?: { nama: string } | null;
  pembeliId: string;
  pembeli?: { nama: string } | null;
  status: Dispatch["status"];
  tanggalJemput: string;
  totalNilai: string | number | null;
  alasanTolak: string | null;
  alasanSelisih: string | null;
  selisihSignifikan: boolean;
  items?: RawDispatchItem[];
};

type RawDispatchItem = {
  id: string;
  jenisSampah?: { nama: string } | null;
  beratTarget: string | number;
  beratAktual: string | number | null;
  hargaJualPerKg: string | number;
  subtotal: string | number | null;
};

function toSetoran(rows: RawSetoran[]): Setoran[] {
  return rows.map((s) => ({
    id: s.id,
    kodeTransaksi: s.kodeTransaksi,
    bankSampah: s.bankSampah?.nama ?? "",
    bankSampahId: s.bankSampahId,
    nasabah: s.nasabah?.nama ?? "",
    nasabahId: s.nasabahId,
    petugas: s.petugas?.nama ?? "",
    petugasId: s.petugasId,
    totalBerat: Number(s.totalBerat),
    totalNilai: Number(s.totalNilai),
    cashDibayar: s.cashDibayar,
    tanggal: s.tanggal,
    idempotencyKey: s.idempotencyKey,
    items: (s.items ?? []).map(
      (i): SetoranItem => ({
        id: i.id,
        jenisSampah: i.jenisSampah?.nama ?? "",
        jenisSampahId: i.jenisSampahId,
        berat: Number(i.berat),
        hargaSaatItu: Number(i.hargaSaatItu),
        subtotal: Number(i.subtotal),
        kondisi: i.kondisi,
      }),
    ),
  }));
}

function toDispatch(rows: RawDispatch[]): Dispatch[] {
  return rows.map((d) => ({
    id: d.id,
    kodeDispatch: d.kodeDispatch,
    bankSampah: d.bankSampah?.nama ?? "",
    bankSampahId: d.bankSampahId,
    pembeli: d.pembeli?.nama ?? "",
    pembeliId: d.pembeliId,
    status: d.status,
    tanggalJemput: d.tanggalJemput,
    totalNilai: d.totalNilai == null ? null : Number(d.totalNilai),
    alasanTolak: d.alasanTolak,
    alasanSelisih: d.alasanSelisih,
    selisihSignifikan: d.selisihSignifikan,
    items: (d.items ?? []).map(
      (i): DispatchItem => ({
        id: i.id,
        jenisSampah: i.jenisSampah?.nama ?? "",
        beratTarget: Number(i.beratTarget),
        beratAktual: i.beratAktual == null ? null : Number(i.beratAktual),
        hargaJualPerKg: Number(i.hargaJualPerKg),
        subtotal: i.subtotal == null ? null : Number(i.subtotal),
      }),
    ),
  }));
}

export default function TransaksiTabs() {
  const [activeTab, setActiveTab] = useState<Tab>("setoran");
  const [setorans, setSetorans] = useState<Setoran[]>([]);
  const [dispatches, setDispatches] = useState<Dispatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [deleting, setDeleting] = useState<Dispatch | null>(null);
  const [deletingLoading, setDeletingLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [sRes, dRes] = await Promise.all([
          api.get<RawSetoran[]>("/setoran"),
          api.get<RawDispatch[]>("/dispatch"),
        ]);
        if (cancelled) return;
        setSetorans(toSetoran(sRes.data));
        setDispatches(toDispatch(dRes.data));
      } catch (e) {
        if (!cancelled) setError(apiError(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function confirmDelete() {
    if (!deleting) return;
    setDeletingLoading(true);
    try {
      await api.delete(`/dispatch/${deleting.id}`);
      setDeleting(null);
      const [sRes, dRes] = await Promise.all([
        api.get<RawSetoran[]>("/setoran"),
        api.get<RawDispatch[]>("/dispatch"),
      ]);
      setSetorans(toSetoran(sRes.data));
      setDispatches(toDispatch(dRes.data));
    } catch (e) {
      setError(apiError(e));
    } finally {
      setDeletingLoading(false);
    }
  }

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
          className="inline-flex items-center gap-1 p-1.5 bg-surface-container-high rounded-full border border-outline-variant"
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
                  : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low",
              )}
            >
              <tab.Icon className="size-5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        {activeTab === "setoran" && (
          <button
            type="button"
            onClick={exportSetoran}
            disabled={loading}
            className="flex items-center justify-center gap-2 h-10 px-4 rounded-lg border border-outline-variant bg-surface text-on-surface hover:bg-surface-container-low transition-colors font-label-md text-label-md disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export Data
          </button>
        )}
        {activeTab === "dispatch" && (
          <button
            type="button"
            onClick={exportDispatch}
            disabled={loading}
            className="flex items-center justify-center gap-2 h-10 px-4 rounded-lg border border-outline-variant bg-surface text-on-surface hover:bg-surface-container-low transition-colors font-label-md text-label-md disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export Data
          </button>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-error-container/10 border border-error rounded-lg">
          <p className="text-error font-label-md text-label-md">{error}</p>
        </div>
      )}

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
          {loading ? (
            <p className="p-6 text-center text-on-surface-variant">Memuat data…</p>
          ) : (
            <SetoranTable
              setorans={setorans}
              onExport={exportSetoran}
              onView={() => {}}
            />
          )}
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
          {loading ? (
            <p className="p-6 text-center text-on-surface-variant">Memuat data…</p>
          ) : (
            <DispatchTable
              dispatches={dispatches}
              onExport={exportDispatch}
              onDelete={setDeleting}
            />
          )}
        </section>
      )}

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title="Hapus Dispatch"
        description={
          deleting
            ? `Yakin ingin menghapus dispatch ${deleting.kodeDispatch}? Tindakan ini tidak dapat dibatalkan.`
            : undefined
        }
        confirmLabel="Hapus"
        loading={deletingLoading}
        onConfirm={confirmDelete}
      />
    </>
  );
}
