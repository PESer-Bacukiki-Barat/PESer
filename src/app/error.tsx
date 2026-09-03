"use client"

import { useEffect } from "react"
import { AlertTriangle, RotateCcw } from "lucide-react"

import { Button } from "@/components/ui/button"

/**
 * Batas error untuk seluruh route di bawah root layout.
 *
 * Tanpa berkas ini, kegagalan runtime apa pun menampilkan layar error bawaan
 * Next — teks Inggris, tanpa jalan keluar, dan di produksi hanya berbunyi
 * "Application error". Untuk petugas di lapangan itu jalan buntu.
 *
 * `reset()` mencoba merender ulang segmen yang gagal TANPA memuat ulang
 * halaman. Itu penting di area petugas: memuat ulang penuh akan membuang
 * state antrean setoran offline yang belum sempat terkirim.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Di produksi Next menyembunyikan pesan aslinya dan hanya memberi `digest`.
    // Dicatat ke console supaya jejaknya tetap ada di log peramban maupun di
    // log server saat error terjadi saat render.
    console.error("Kegagalan render:", error.digest ?? error.message)
  }, [error])

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 text-center">
        <span
          aria-hidden
          className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-error-container text-on-error-container"
        >
          <AlertTriangle className="size-6" />
        </span>

        <h1 className="font-headline-md text-headline-md text-on-surface">
          Ada yang tidak beres
        </h1>
        <p className="mt-2 font-body-md text-body-md text-on-surface-variant">
          Halaman ini gagal ditampilkan. Data Anda tidak hilang — coba muat
          ulang bagiannya.
        </p>

        {error.digest && (
          // Kode ini yang menghubungkan keluhan pengguna dengan baris log di
          // server. Tanpa itu, "errornya muncul tadi pagi" tidak bisa dilacak.
          <p className="mt-3 font-label-sm text-label-sm text-on-surface-variant">
            Kode kesalahan:{" "}
            <span className="font-mono text-on-surface">{error.digest}</span>
          </p>
        )}

        <Button type="button" onClick={reset} className="mt-5 h-11 w-full">
          <RotateCcw className="size-4" aria-hidden />
          Coba lagi
        </Button>
      </div>
    </main>
  )
}
