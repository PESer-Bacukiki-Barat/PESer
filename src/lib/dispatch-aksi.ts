import type { StatusDispatch } from "@/generated/prisma/client"

/**
 * Tabel transisi dispatch PRD §8.2 — sumber kebenaran tunggal.
 *
 * Modul ini sengaja TIDAK mengimpor Prisma runtime (hanya `import type`, yang
 * hilang saat compile) supaya bisa dipakai Client Component juga. Dengan
 * begitu tombol di UI diturunkan dari tabel yang sama dengan yang menegakkan
 * aturan di server — UI tidak mungkin menawarkan aksi yang akan ditolak API,
 * dan tidak mungkin menyembunyikan aksi yang sebenarnya sah.
 *
 * Sisi server memakainya lewat src/lib/dispatch-transisi.ts.
 */

export type Pelaku = "ADMIN" | "PETUGAS_PEMILIK"

export type Transisi = { dari: StatusDispatch; ke: StatusDispatch; pelaku: Pelaku }

/** Urutan mengikuti tabel §8.2 supaya mudah dibandingkan dengan PRD. */
export const TRANSISI: readonly Transisi[] = [
  { dari: "DRAFT", ke: "DISPATCHED", pelaku: "ADMIN" },
  { dari: "DRAFT", ke: "DIBATALKAN", pelaku: "ADMIN" },
  { dari: "DISPATCHED", ke: "DITERIMA", pelaku: "PETUGAS_PEMILIK" },
  { dari: "DISPATCHED", ke: "DITOLAK", pelaku: "PETUGAS_PEMILIK" },
  { dari: "DISPATCHED", ke: "DIBATALKAN", pelaku: "ADMIN" },
  { dari: "DITOLAK", ke: "DRAFT", pelaku: "ADMIN" },
  { dari: "DITOLAK", ke: "DIBATALKAN", pelaku: "ADMIN" },
  { dari: "DITERIMA", ke: "SERAH_TERIMA", pelaku: "PETUGAS_PEMILIK" },
  { dari: "DITERIMA", ke: "DIBATALKAN", pelaku: "ADMIN" },
  { dari: "SERAH_TERIMA", ke: "SELESAI", pelaku: "ADMIN" },
]

/**
 * Status yang menahan reservasi stock (BR-12). Meninggalkannya ke
 * DITOLAK/DIBATALKAN wajib melepas reservasi.
 */
export const MENAHAN_RESERVASI: readonly StatusDispatch[] = ["DISPATCHED", "DITERIMA"]

/** Status akhir — tidak ada transisi keluar (BR-13). */
export const STATUS_FINAL: readonly StatusDispatch[] = ["SELESAI", "DIBATALKAN"]

/**
 * Status yang isinya masih boleh disunting lewat PUT (§8.2 "DITOLAK -> DRAFT:
 * Revisi target / ganti bank sampah"). Di luar ini, perubahan hanya lewat
 * transisi status. BR-13: SELESAI final.
 */
export const BOLEH_REVISI: readonly StatusDispatch[] = ["DRAFT", "DITOLAK"]

/** Masukan tambahan yang harus diminta ke pengguna sebelum aksi dijalankan. */
export type KebutuhanAksi = "alasan" | "berat-aktual" | "nilai" | null

export type AksiDispatch = {
  /** Status tujuan. */
  ke: StatusDispatch
  /** Segmen URL endpoint: POST /api/dispatch/:id/{slug}. */
  slug: string
  label: string
  /** Kalimat konfirmasi / penjelasan singkat untuk pengguna. */
  keterangan: string
  perlu: KebutuhanAksi
  gaya: "utama" | "netral" | "bahaya"
}

/**
 * Metadata per status tujuan. Dipisah dari tabel transisi karena satu status
 * tujuan bisa dicapai dari beberapa status asal, tapi labelnya sama.
 */
const META: Record<StatusDispatch, Omit<AksiDispatch, "ke">> = {
  DRAFT: {
    slug: "revisi",
    label: "Kembalikan ke Draft",
    keterangan: "Dispatch bisa disunting lagi lalu diterbitkan ulang.",
    perlu: null,
    gaya: "netral",
  },
  DISPATCHED: {
    slug: "terbitkan",
    label: "Terbitkan",
    keterangan: "Stock sejumlah target akan direservasi (BR-12).",
    perlu: null,
    gaya: "utama",
  },
  DITERIMA: {
    slug: "terima",
    label: "Terima",
    keterangan: "Menyatakan barang siap diserahkan ke pembeli.",
    perlu: null,
    gaya: "utama",
  },
  DITOLAK: {
    slug: "tolak",
    label: "Tolak",
    keterangan: "Reservasi stock dilepas. Alasan wajib diisi.",
    perlu: "alasan",
    gaya: "bahaya",
  },
  SERAH_TERIMA: {
    slug: "serah-terima",
    label: "Konfirmasi Serah Terima",
    keterangan: "Stock berkurang sesuai berat aktual (BR-11). Tidak bisa dibatalkan.",
    perlu: "berat-aktual",
    gaya: "utama",
  },
  SELESAI: {
    slug: "tutup",
    label: "Tutup Dispatch",
    keterangan: "Status final, laporan tidak berubah lagi (BR-13).",
    perlu: "nilai",
    gaya: "utama",
  },
  DIBATALKAN: {
    slug: "batalkan",
    label: "Batalkan",
    keterangan: "Status final. Reservasi stock dilepas kalau masih ditahan.",
    perlu: null,
    gaya: "bahaya",
  },
}

export type PenggunaAksi = {
  role: "ADMIN" | "PETUGAS"
  bankSampahId: string | null
}

/** "PETUGAS pemilik" = user.bankSampahId === dispatch.bankSampahId (§8.2). */
export function pelakuBoleh(
  pelaku: Pelaku,
  user: PenggunaAksi,
  bankSampahId: string,
): boolean {
  if (pelaku === "ADMIN") return user.role === "ADMIN"
  return user.role === "PETUGAS" && user.bankSampahId === bankSampahId
}

/**
 * Aksi yang boleh dijalankan pengguna ini pada dispatch dengan status ini.
 * Dipakai UI untuk menentukan tombol apa yang muncul.
 */
export function aksiTersedia(
  status: StatusDispatch,
  user: PenggunaAksi,
  bankSampahId: string,
): AksiDispatch[] {
  return TRANSISI.filter(
    (t) => t.dari === status && pelakuBoleh(t.pelaku, user, bankSampahId),
  ).map((t) => ({ ke: t.ke, ...META[t.ke] }))
}

/** Semua transisi keluar dari status ini, tanpa menyaring pelaku. */
export function transisiDari(status: StatusDispatch): readonly Transisi[] {
  return TRANSISI.filter((t) => t.dari === status)
}
