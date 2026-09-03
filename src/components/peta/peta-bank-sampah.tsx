"use client"

import dynamic from "next/dynamic"

import type { MarkerBankSampah } from "@/lib/level-stock"
import { MapPin } from "lucide-react"
import { KeadaanKosong } from "@/components/ui/keadaan-kosong"

/**
 * `leaflet` membaca `window` saat modul dievaluasi, jadi ia harus dimuat hanya
 * di browser. `ssr: false` hanya sah dipanggil dari Client Component — itulah
 * sebabnya pembungkus tipis ini ada: halaman /admin/peta dan /petugas/stock
 * tetap Server Component dan mengimpor komponen ini seperti komponen biasa.
 *
 * Pola yang sama dipakai LocationPicker di `bank-sampah-form.tsx`.
 */
const PetaLeaflet = dynamic(
  () => import("@/components/peta/peta-leaflet").then((m) => m.PetaLeaflet),
  {
    ssr: false,
    loading: () => (
      <div
        className="flex w-full items-center justify-center rounded-xl border border-outline-variant bg-surface-container-low font-label-md text-label-md text-on-surface-variant"
        style={{ height: "var(--tinggi-peta, 420px)" }}
      >
        Memuat peta...
      </div>
    ),
  },
)

/** Peta sebaran bank sampah dengan warna marker per level stock — FR-E2. */
export function PetaBankSampah({
  markers,
  height = 420,
}: {
  markers: MarkerBankSampah[]
  height?: number
}) {
  // Tanpa marker, Leaflet tidak perlu diunduh sama sekali.
  if (markers.length === 0) {
    return (
      <KeadaanKosong Ikon={MapPin} aksen="tempat" judul="Belum ada titik di peta">
        Bank sampah muncul di peta setelah titik koordinatnya diisi pada data
        bank sampah.
      </KeadaanKosong>
    )
  }

  // Tinggi dititipkan lewat CSS variable supaya placeholder `loading` di atas
  // memakai tinggi yang sama — kalau tidak, layout melompat saat peta selesai
  // dimuat.
  return (
    <div style={{ "--tinggi-peta": `${height}px` } as React.CSSProperties}>
      <PetaLeaflet markers={markers} height={height} />
    </div>
  )
}
