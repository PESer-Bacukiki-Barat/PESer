"use client"

import { useEffect, useRef } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

import {
  GAYA_LEVEL,
  pusatPeta,
  type MarkerBankSampah,
} from "@/lib/level-stock"
import { fmtBerat } from "@/lib/format"

/** Kalau tidak ada koordinat sama sekali, jatuh ke pusat Parepare. */
const PUSAT_CADANGAN: [number, number] = [-4.0135, 119.6255]

/**
 * Buat ikon marker dari level stock.
 *
 * Warnanya memakai CSS variable tema, bukan hex, sehingga marker ikut berubah
 * kalau palet DESIGN.md diubah. Bank sampah non-aktif digambar sebagai cincin
 * kosong: masih terlihat posisinya, tapi jelas bukan bagian dari operasi
 * harian sehingga tidak salah dibaca sebagai target jemput.
 */
function ikon(m: MarkerBankSampah): L.DivIcon {
  const gaya = GAYA_LEVEL[m.level]
  const isi = m.isActive ? gaya.warna : "transparent"
  const tebalCincin = m.isActive ? 3 : 2

  return L.divIcon({
    className: "peser-marker",
    html: `<span
      role="img"
      aria-label="${m.nama}, ${gaya.label}"
      style="
        display:block;width:22px;height:22px;border-radius:9999px;
        background:${isi};
        border:${tebalCincin}px solid ${m.isActive ? "var(--color-on-primary)" : gaya.warna};
        box-shadow:0 1px 4px rgb(0 0 0 / 0.35);
      "></span>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -12],
  })
}

function isiPopup(m: MarkerBankSampah): string {
  const gaya = GAYA_LEVEL[m.level]
  const ambang =
    m.threshold > 0
      ? `Ambang jemput ${fmtBerat(m.threshold)} kg`
      : "Ambang jemput belum diatur"

  // textContent tidak tersedia di string HTML popup, jadi nama dan alamat
  // di-escape supaya data dari database tidak bisa menyuntik markup.
  const esc = (t: string) =>
    t.replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
    )

  return `
    <div style="min-width:190px">
      <strong style="display:block;font-size:14px">${esc(m.nama)}</strong>
      ${m.kelurahan ? `<span style="color:#666;font-size:12px">${esc(m.kelurahan)}</span>` : ""}
      <div style="margin-top:6px;font-size:13px">
        <strong>${fmtBerat(m.berat)} kg</strong> — ${gaya.label}
      </div>
      <div style="color:#666;font-size:12px">${ambang}</div>
      <div style="color:#666;font-size:12px;margin-top:4px">${esc(m.alamat)}</div>
      ${m.isActive ? "" : `<div style="color:#b00;font-size:12px;margin-top:4px">Non-aktif</div>`}
    </div>`
}

/**
 * Implementasi peta Leaflet — FR-E2.
 *
 * Modul ini TIDAK boleh diimpor langsung oleh Server Component: `leaflet`
 * menyentuh `window` saat modul dievaluasi, jadi ia harus dimuat lewat
 * `dynamic(..., { ssr: false })`. Pembungkusnya ada di `peta-bank-sampah.tsx` —
 * pola yang sama dengan LocationPicker di `bank-sampah-form.tsx`.
 *
 * Marker sudah dihitung di server, jadi komponen ini tidak tahu apa pun
 * tentang Prisma maupun scope peran. Admin mengirim seluruh bank sampah,
 * petugas hanya miliknya sendiri (§2.4) — pembatasannya di sisi pemanggil.
 */
export function PetaLeaflet({
  markers,
  height = 420,
}: {
  markers: MarkerBankSampah[]
  height?: number
}) {
  const wadahRef = useRef<HTMLDivElement>(null)
  const petaRef = useRef<L.Map | null>(null)

  useEffect(() => {
    const wadah = wadahRef.current
    if (!wadah || petaRef.current) return

    const peta = L.map(wadah, { zoomControl: true, scrollWheelZoom: false })
    petaRef.current = peta

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap",
    }).addTo(peta)

    const lapisan = markers.map((m) =>
      L.marker([m.latitude, m.longitude], { icon: ikon(m), title: m.nama }).bindPopup(
        isiPopup(m),
      ),
    )
    lapisan.forEach((l) => l.addTo(peta))

    if (lapisan.length > 1) {
      // fitBounds memuat semua marker; padding supaya tidak menempel tepi.
      peta.fitBounds(L.featureGroup(lapisan).getBounds(), { padding: [40, 40] })
    } else {
      peta.setView(pusatPeta(markers) ?? PUSAT_CADANGAN, markers.length === 1 ? 15 : 13)
    }

    // Peta yang dirender di dalam wadah yang baru mendapat ukuran (mis. setelah
    // hydration) kadang menghitung tinggi 0. Satu invalidateSize memperbaikinya.
    const timer = window.setTimeout(() => peta.invalidateSize(), 0)

    return () => {
      window.clearTimeout(timer)
      peta.remove()
      petaRef.current = null
    }
  }, [markers])

  return (
    <div
      ref={wadahRef}
      style={{ height }}
      className="w-full overflow-hidden rounded-xl border border-outline-variant bg-surface-container-low"
      // Peta bukan satu-satunya jalan membaca data ini: daftar di bawahnya
      // memuat isi yang sama dalam bentuk teks, jadi peta ditandai presentasi.
      role="img"
      aria-label={`Peta sebaran ${markers.length} bank sampah`}
    />
  )
}
