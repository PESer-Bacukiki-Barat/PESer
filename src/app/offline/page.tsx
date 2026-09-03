import type { Metadata } from "next"
import Link from "next/link"
import { WifiOff } from "lucide-react"

export const metadata: Metadata = {
  title: "Offline",
}

/**
 * Halaman cadangan saat service worker tidak menemukan salinan cache — FR-F1.
 *
 * Dibuat statis (tanpa akses database maupun sesi) supaya bisa di-precache saat
 * install dan tetap tampil ketika jaringan benar-benar mati. Isinya menjelaskan
 * apa yang MASIH bisa dilakukan, bukan hanya mengabarkan kegagalan.
 */
export default function OfflinePage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
      <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6">
        <WifiOff className="size-8 text-on-surface-variant mb-3" aria-hidden />
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface mb-2">
          Tidak ada koneksi
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Halaman ini belum tersimpan di perangkat, jadi belum bisa dibuka tanpa
          internet.
        </p>

        <div className="mt-4 rounded-lg border border-outline-variant p-3">
          <p className="font-label-md text-label-md text-on-surface mb-1">
            Yang masih bisa dilakukan
          </p>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Form setoran tetap bisa dipakai selama sudah pernah dibuka. Setoran
            yang Anda catat tersimpan di perangkat dan terkirim sendiri begitu
            koneksi pulih.
          </p>
        </div>

        <Link
          href="/petugas/setor"
          className="tekan-halus mt-4 flex h-12 items-center justify-center rounded-lg bg-primary font-label-md text-label-md text-on-primary hover:bg-primary/90"
        >
          Buka Form Setoran
        </Link>
        <Link
          href="/petugas"
          className="tekan-halus mt-2 flex h-11 items-center justify-center rounded-lg border border-outline-variant font-label-md text-label-md text-on-surface hover:bg-surface-container-low"
        >
          Coba Beranda
        </Link>
      </div>
    </main>
  )
}
