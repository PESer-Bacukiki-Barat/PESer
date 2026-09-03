"use client";

import { useState } from "react";
import { CloudOff, RefreshCw, Trash2, WifiOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { logout } from "@/app/actions/auth";
import { useAntrean } from "@/components/petugas/antrean-provider";
import { fmtBerat, fmtRupiah } from "@/lib/format";

/**
 * Badge antrean di header — §4.3 aturan 5. Reuse penuh perilaku bar-antrean
 * milik petugas; hanya label ringkasannya yang beda (area warga).
 */
export function BadgeAntrean() {
  const { tertunda, gagal, sedangSinkron, online, daftar, sinkron, buang, cobaLagi } =
    useAntrean();
  const [buka, setBuka] = useState(false);

  const total = tertunda + gagal;
  if (total === 0 && online) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setBuka(true)}
        aria-label={
          total > 0 ? `${total} setoran menunggu dikirim` : "Sedang offline"
        }
        className={`flex h-9 shrink-0 items-center gap-1.5 rounded-lg border px-2.5 font-label-sm text-label-sm transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/50 ${
          gagal > 0
            ? "border-error bg-error-container/40 text-on-error-container"
            : total > 0
              ? "border-tertiary bg-tertiary-container/40 text-on-tertiary-container"
              : "border-outline-variant text-on-surface-variant"
        }`}
      >
        {online ? (
          <CloudOff className="size-4" aria-hidden />
        ) : (
          <WifiOff className="size-4" aria-hidden />
        )}
        {total > 0 ? <span className="font-mono">{total}</span> : <span>Offline</span>}
      </button>

      <Modal
        open={buka}
        onOpenChange={setBuka}
        title="Antrean Setoran"
        description={
          online
            ? "Setoran yang belum sampai ke server. Akan terkirim otomatis."
            : "Anda sedang offline. Setoran tersimpan di perangkat dan dikirim saat koneksi pulih."
        }
      >
        <div className="space-y-3">
          {daftar.length === 0 ? (
            <p className="font-body-md text-body-md text-on-surface-variant">
              Antrean kosong.
            </p>
          ) : (
            <ul className="space-y-2">
              {daftar.map((d) => (
                <li
                  key={d.idempotencyKey}
                  className="rounded-lg border border-outline-variant p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-label-md text-label-md text-on-surface truncate">
                        {d.ringkasan.nasabah}
                      </p>
                      <p className="font-mono font-label-sm text-label-sm text-on-surface-variant">
                        {fmtBerat(d.ringkasan.totalBerat)} kg ·{" "}
                        {fmtRupiah(d.ringkasan.totalNilai)}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 font-label-sm text-label-sm ${
                        d.status === "PENDING_SYNC"
                          ? "bg-tertiary-container text-on-tertiary-container"
                          : "bg-error-container text-on-error-container"
                      }`}
                    >
                      {d.status === "PENDING_SYNC"
                        ? "Menunggu"
                        : d.status === "GAGAL"
                          ? "Gagal"
                          : "Kedaluwarsa"}
                    </span>
                  </div>

                  {d.pesanGagal && (
                    <p className="mt-1 font-label-sm text-label-sm text-error">
                      {d.pesanGagal}
                    </p>
                  )}
                  {d.percobaan > 0 && (
                    <p className="mt-1 font-label-sm text-label-sm text-on-surface-variant">
                      {d.percobaan}x percobaan
                    </p>
                  )}

                  {d.status !== "PENDING_SYNC" && (
                    <div className="mt-2 flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => cobaLagi(d.idempotencyKey)}
                      >
                        <RefreshCw aria-hidden /> Coba lagi
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => buang(d.idempotencyKey)}
                      >
                        <Trash2 aria-hidden /> Buang
                      </Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}

          {tertunda > 0 && (
            <Button
              type="button"
              className="w-full"
              onClick={() => sinkron()}
              disabled={sedangSinkron || !online}
            >
              {sedangSinkron
                ? "Mengirim..."
                : online
                  ? `Kirim ${tertunda} setoran sekarang`
                  : "Menunggu koneksi"}
            </Button>
          )}
        </div>
      </Modal>
    </>
  );
}

/**
 * Tombol keluar — §4.3 aturan 6 "Peringatkan sebelum logout kalau ada antrean
 * tertunda". Antrean hidup di IndexedDB per perangkat; keluar tanpa mengirim
 * berarti setoran menggantung sampai login lagi di perangkat yang sama.
 */
export function TombolKeluar() {
  const { tertunda, sedangSinkron, online, sinkron } = useAntrean();
  const [konfirmasi, setKonfirmasi] = useState(false);

  if (tertunda === 0) {
    return (
      <form action={logout}>
        <button
          type="submit"
          className="sentuh-nyaman tekan-halus h-9 shrink-0 rounded-lg border border-outline-variant px-3 font-label-sm text-label-sm text-on-surface-variant hover:bg-surface-container-low focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/50"
        >
          Keluar
        </button>
      </form>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setKonfirmasi(true)}
        className="h-9 shrink-0 rounded-lg border border-error px-3 font-label-sm text-label-sm text-on-error-container transition-colors hover:bg-error-container/40 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/50"
      >
        Keluar
      </button>

      {/* Modal, bukan ConfirmDialog: keluar bisa dibatalkan; yang berisiko
          adalah antrean yang tertinggal di perangkat ini. */}
      <Modal
        open={konfirmasi}
        onOpenChange={setKonfirmasi}
        size="sm"
        title={`${tertunda} setoran belum terkirim`}
        description={
          online
            ? "Setoran ini tersimpan di perangkat ini saja. Sebaiknya kirim dulu sebelum keluar."
            : "Anda sedang offline. Setoran ini hanya bisa dikirim setelah koneksi pulih, dari perangkat ini."
        }
      >
        <div className="space-y-2">
          {online && (
            <Button
              type="button"
              className="w-full"
              onClick={() => sinkron()}
              disabled={sedangSinkron}
            >
              {sedangSinkron ? "Mengirim..." : `Kirim ${tertunda} setoran dulu`}
            </Button>
          )}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setKonfirmasi(false)}
              disabled={sedangSinkron}
            >
              Tetap di sini
            </Button>
            <form action={logout} className="flex-1">
              <Button
                type="submit"
                variant="destructive"
                className="w-full"
                disabled={sedangSinkron}
              >
                Keluar saja
              </Button>
            </form>
          </div>
          <p className="font-label-sm text-label-sm text-on-surface-variant">
            Antrean tetap tersimpan di perangkat ini dan bisa dikirim setelah Anda
            login kembali.
          </p>
        </div>
      </Modal>
    </>
  );
}
