/**
 * Level stock bank sampah — dasar warna marker peta (FR-E2).
 *
 * Murni, tanpa Prisma maupun DOM, supaya bisa dipakai Server Component
 * (menghitung) dan Client Component (mewarnai marker) sekaligus, dan bisa
 * diuji tanpa peta.
 *
 * Warna diambil dari CSS variable tema, bukan hex yang ditulis ulang, supaya
 * peta tidak melenceng dari DESIGN.md ketika palet berubah.
 */

export type LevelStock = "KOSONG" | "TERISI" | "NORMAL" | "SIAP_JEMPUT"

export type RingkasanStock = {
  /** Total berat seluruh jenis di bank sampah ini. */
  berat: number
  /** Total ambang seluruh jenis. 0 berarti belum diatur. */
  threshold: number
}

/**
 * Tentukan level dari berat vs ambang.
 *
 * Penanganan ambang 0 adalah inti fungsi ini. `berat >= threshold` secara naif
 * akan menandai bank sampah KOSONG (0 kg, ambang 0) sebagai "siap jemput" —
 * sebuah keliru yang mengirim armada ke gudang kosong. Ambang 0 berarti belum
 * ada dasar untuk menilai, bukan bahwa ambangnya sudah terlewati.
 */
export function levelStock({ berat, threshold }: RingkasanStock): LevelStock {
  if (berat <= 0) return "KOSONG"
  if (threshold <= 0) return "TERISI"
  return berat >= threshold ? "SIAP_JEMPUT" : "NORMAL"
}

export type GayaLevel = {
  label: string
  /** Penjelasan singkat untuk legenda dan tooltip. */
  keterangan: string
  /** CSS variable tema, dipakai sebagai isi marker. */
  warna: string
  /** Kelas Tailwind untuk badge di daftar pendamping peta. */
  badge: string
}

export const GAYA_LEVEL: Record<LevelStock, GayaLevel> = {
  KOSONG: {
    label: "Kosong",
    keterangan: "Belum ada stock tercatat",
    warna: "var(--color-outline-variant)",
    badge: "bg-surface-container-high text-on-surface-variant",
  },
  TERISI: {
    label: "Terisi",
    keterangan: "Ada stock, ambang jemput belum diatur",
    warna: "var(--color-secondary)",
    badge: "bg-secondary-container text-on-secondary-container",
  },
  NORMAL: {
    label: "Normal",
    keterangan: "Masih di bawah ambang jemput",
    warna: "var(--color-primary)",
    badge: "bg-primary-container text-on-primary-container",
  },
  SIAP_JEMPUT: {
    label: "Siap Jemput",
    keterangan: "Sudah mencapai ambang jemput",
    warna: "var(--color-tertiary)",
    badge: "bg-tertiary-container text-on-tertiary-container",
  },
}

/** Urutan tampil di legenda: dari yang paling butuh tindakan. */
export const URUTAN_LEVEL: readonly LevelStock[] = [
  "SIAP_JEMPUT",
  "NORMAL",
  "TERISI",
  "KOSONG",
]

export type MarkerBankSampah = {
  id: string
  nama: string
  kelurahan: string | null
  alamat: string
  latitude: number
  longitude: number
  isActive: boolean
  berat: number
  threshold: number
  level: LevelStock
}

/** Titik tengah peta dari sekumpulan marker; null kalau tidak ada koordinat. */
export function pusatPeta(
  markers: Pick<MarkerBankSampah, "latitude" | "longitude">[],
): [number, number] | null {
  if (markers.length === 0) return null
  const lat = markers.reduce((a, m) => a + m.latitude, 0) / markers.length
  const lng = markers.reduce((a, m) => a + m.longitude, 0) / markers.length
  return [lat, lng]
}
