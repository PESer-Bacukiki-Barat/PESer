import { levelStock, type LevelStock } from "@/lib/level-stock"

/**
 * Data seed — dipisah dari penulisannya (prisma/seed.ts) supaya bisa diuji
 * tanpa database.
 *
 * Semua acuan antar-entitas memakai KUNCI ALAMI (kodeWilayah, kode jenis,
 * kodeNasabah, email), bukan id, karena id baru dibuat saat penulisan. Itu juga
 * yang membuat seed-nya idempoten: dijalankan dua kali tidak menduplikasi
 * apa pun.
 *
 * Isinya dirancang supaya fitur bisa langsung didemokan tanpa menyiapkan data
 * dulu — lihat RINGKASAN_LEVEL di bawah: keempat level marker peta (FR-E2)
 * muncul semua, dan ada satu stock yang sengaja tepat di bawah ambangnya
 * supaya notifikasi FR-E5 bisa dipicu dengan satu setoran kecil.
 */

export type SeedKelurahan = { nama: string; kodeWilayah: string }

export type SeedBankSampah = {
  nama: string
  /** Acuan ke SeedKelurahan.kodeWilayah (BR-01: 1 kelurahan = 1 bank sampah). */
  kodeWilayah: string
  alamat: string
  latitude: number
  longitude: number
  isActive: boolean
}

export type SeedJenisSampah = {
  kode: number
  nama: string
  kategori: string
  satuan: string
  harga: number
  isActive: boolean
}

export type SeedPembeli = {
  nama: string
  perusahaan: string | null
  noHp: string
  alamat: string
}

export type SeedNasabah = {
  kodeNasabah: string
  /** Acuan ke SeedBankSampah.nama. */
  bankSampah: string
  nama: string
  noHp: string
  alamat: string
  rt: string
  rw: string
}

export type SeedUser = {
  email: string
  nama: string
  role: "ADMIN" | "PETUGAS"
  /** Acuan ke SeedBankSampah.nama; wajib untuk PETUGAS (BR-02). */
  bankSampah: string | null
  /** Penautan ke Nasabah untuk area warga (src/lib/nasabah-tertaut.ts). */
  noHp: string | null
}

export type SeedSetoran = {
  /** Dipakai sebagai idempotencyKey; unique di skema, jadi seed aman diulang. */
  kunci: string
  bankSampah: string
  /** Acuan ke SeedNasabah.kodeNasabah. */
  nasabah: string
  /** Acuan ke SeedUser.email; harus PETUGAS di bank sampah yang sama. */
  petugas: string
  /** Berapa hari sebelum hari ini, supaya filter periode laporan ada isinya. */
  hariLalu: number
  items: {
    /** Acuan ke SeedJenisSampah.kode. */
    jenis: number
    berat: number
    kondisi: "BERSIH" | "KOTOR" | "CAMPUR"
  }[]
}

export type SeedThreshold = {
  bankSampah: string
  jenis: number
  threshold: number
}

// ---------------------------------------------------------------------------

export const KELURAHAN: SeedKelurahan[] = [
  { nama: "Bacukiki Barat", kodeWilayah: "7372011" },
  { nama: "Bumi Harapan", kodeWilayah: "7372012" },
  { nama: "Lumpue", kodeWilayah: "7372013" },
  { nama: "Tiro Sompe", kodeWilayah: "7372014" },
]

/** Koordinat di sekitar Bacukiki Barat, Parepare. */
export const BANK_SAMPAH: SeedBankSampah[] = [
  {
    nama: "BS Mawar",
    kodeWilayah: "7372011",
    alamat: "Jl. Mawar No. 1, Bacukiki Barat",
    latitude: -4.0135,
    longitude: 119.6255,
    isActive: true,
  },
  {
    nama: "BS Melati",
    kodeWilayah: "7372012",
    alamat: "Jl. Melati No. 12, Bumi Harapan",
    latitude: -4.0182,
    longitude: 119.6301,
    isActive: true,
  },
  {
    nama: "BS Anggrek",
    kodeWilayah: "7372013",
    alamat: "Jl. Anggrek No. 7, Lumpue",
    latitude: -4.0221,
    longitude: 119.6188,
    isActive: true,
  },
  {
    // Sengaja non-aktif: peta menggambarnya sebagai cincin kosong, dan itu
    // keadaan yang perlu ikut terlihat saat fiturnya ditinjau.
    nama: "BS Kenanga",
    kodeWilayah: "7372014",
    alamat: "Jl. Kenanga No. 3, Tiro Sompe",
    latitude: -4.015,
    longitude: 119.627,
    isActive: false,
  },
]

/**
 * PRD §1.3 menyebut seed jenis sampah plastik kode 1–7; di sini kodenya
 * dikelompokkan per kategori (1xx plastik, 2xx kertas, 3xx logam) supaya
 * penambahan jenis baru tidak mengubah nomor yang sudah dipakai.
 *
 * "Sampah Tanpa Harga" berharga 0 dengan sengaja: BR-16 melarangnya masuk
 * setoran, dan tanpa satu contoh nyata aturan itu tidak pernah teruji di layar.
 */
export const JENIS_SAMPAH: SeedJenisSampah[] = [
  { kode: 101, nama: "Botol PET Bening", kategori: "PLASTIK", satuan: "KG", harga: 3000, isActive: true },
  { kode: 102, nama: "Botol PET Warna", kategori: "PLASTIK", satuan: "KG", harga: 2500, isActive: true },
  { kode: 103, nama: "Gelas Plastik (PP)", kategori: "PLASTIK", satuan: "KG", harga: 2000, isActive: true },
  { kode: 201, nama: "Kardus Campur", kategori: "KERTAS", satuan: "KG", harga: 1800, isActive: true },
  { kode: 202, nama: "Kertas HVS", kategori: "KERTAS", satuan: "KG", harga: 2200, isActive: true },
  { kode: 301, nama: "Kaleng Alumunium", kategori: "LOGAM", satuan: "KG", harga: 12000, isActive: true },
  { kode: 302, nama: "Besi Tua", kategori: "LOGAM", satuan: "KG", harga: 4500, isActive: true },
  { kode: 900, nama: "Sampah Tanpa Harga", kategori: "LAIN", satuan: "KG", harga: 0, isActive: true },
]

export const PEMBELI: SeedPembeli[] = [
  { nama: "PT Daur Ulang Jaya", perusahaan: "PT Daur Ulang Jaya", noHp: "08123456789", alamat: "Jl. Industri No. 5, Parepare" },
  { nama: "UD Plastik Makmur", perusahaan: "UD Plastik Makmur", noHp: "08111000002", alamat: "Jl. Industri No. 12, Parepare" },
  { nama: "Koperasi Kertas Sejahtera", perusahaan: "Koperasi Kertas Sejahtera", noHp: "08111000003", alamat: "Jl. Niaga No. 4, Parepare" },
]

export const NASABAH: SeedNasabah[] = [
  { kodeNasabah: "NSB-001", bankSampah: "BS Mawar", nama: "Hasnah", noHp: "081234500001", alamat: "Jl. Mawar No. 5", rt: "01", rw: "02" },
  { kodeNasabah: "NSB-002", bankSampah: "BS Mawar", nama: "Muh. Rizal", noHp: "081234500002", alamat: "Jl. Mawar No. 9", rt: "01", rw: "02" },
  { kodeNasabah: "NSB-003", bankSampah: "BS Melati", nama: "Fatimah", noHp: "081234500003", alamat: "Jl. Melati No. 3", rt: "02", rw: "01" },
  { kodeNasabah: "NSB-004", bankSampah: "BS Melati", nama: "Abd. Rahman", noHp: "081234500004", alamat: "Jl. Melati No. 8", rt: "02", rw: "01" },
  { kodeNasabah: "NSB-005", bankSampah: "BS Anggrek", nama: "Nurhayati", noHp: "081234500005", alamat: "Jl. Anggrek No. 2", rt: "03", rw: "04" },
  { kodeNasabah: "NSB-006", bankSampah: "BS Anggrek", nama: "Syamsuddin", noHp: "081234500006", alamat: "Jl. Anggrek No. 6", rt: "03", rw: "04" },
]

/**
 * Akun. Email dipakai sebagai kunci upsert, jadi menjalankan seed ulang
 * memperbarui akun yang sama — tidak membuat akun kedua.
 *
 * `petugas@peser.local` diberi noHp yang sama dengan NSB-001 supaya area warga
 * /(user) punya satu akun yang benar-benar tertaut untuk dicoba. Formatnya
 * sengaja berbeda dari yang tersimpan di Nasabah ("0812-3450-0001" vs
 * "081234500001") untuk membuktikan normalisasi nomor bekerja.
 *
 * `petugas2@peser.local` sengaja TANPA noHp: itu keadaan "belum tertaut" yang
 * harus menampilkan penjelasan, bukan data nasabah orang lain.
 */
export const USER: SeedUser[] = [
  { email: "admin@peser.local", nama: "Administrator", role: "ADMIN", bankSampah: null, noHp: null },
  { email: "camat@peser.local", nama: "Kepala Kecamatan", role: "ADMIN", bankSampah: null, noHp: null },
  { email: "petugas@peser.local", nama: "Andi Petugas", role: "PETUGAS", bankSampah: "BS Mawar", noHp: "0812-3450-0001" },
  { email: "petugas2@peser.local", nama: "Sitti Petugas", role: "PETUGAS", bankSampah: "BS Melati", noHp: null },
  { email: "petugas3@peser.local", nama: "Rusdi Petugas", role: "PETUGAS", bankSampah: "BS Anggrek", noHp: null },
]

/**
 * Riwayat setoran. Stock TIDAK di-set langsung: ia terbentuk dari setoran ini,
 * persis seperti di aplikasi. Dengan begitu seed tidak pernah melanggar §8.7
 * ("Stock tidak berubah di luar transaksi yang juga menulis StockMutation") dan
 * angka di halaman stock selalu cocok dengan riwayat mutasinya.
 */
export const SETORAN: SeedSetoran[] = [
  {
    kunci: "seed-01-mawar-hasnah",
    bankSampah: "BS Mawar",
    nasabah: "NSB-001",
    petugas: "petugas@peser.local",
    hariLalu: 12,
    items: [
      { jenis: 101, berat: 60, kondisi: "BERSIH" },
      { jenis: 201, berat: 40, kondisi: "BERSIH" },
    ],
  },
  {
    kunci: "seed-02-mawar-rizal",
    bankSampah: "BS Mawar",
    nasabah: "NSB-002",
    petugas: "petugas@peser.local",
    hariLalu: 5,
    items: [
      { jenis: 101, berat: 60, kondisi: "KOTOR" },
      { jenis: 201, berat: 40, kondisi: "BERSIH" },
      { jenis: 301, berat: 15, kondisi: "BERSIH" },
    ],
  },
  {
    kunci: "seed-03-melati-fatimah",
    bankSampah: "BS Melati",
    nasabah: "NSB-003",
    petugas: "petugas2@peser.local",
    hariLalu: 9,
    items: [
      // 45 kg dengan ambang 50: satu setoran 5 kg saja sudah melewatinya,
      // jadi notifikasi FR-E5 bisa dipicu tanpa menyiapkan apa pun dulu.
      { jenis: 101, berat: 45, kondisi: "BERSIH" },
      { jenis: 102, berat: 20, kondisi: "CAMPUR" },
    ],
  },
  {
    kunci: "seed-04-melati-rahman",
    bankSampah: "BS Melati",
    nasabah: "NSB-004",
    petugas: "petugas2@peser.local",
    hariLalu: 2,
    items: [{ jenis: 201, berat: 30, kondisi: "BERSIH" }],
  },
  {
    kunci: "seed-05-anggrek-nurhayati",
    bankSampah: "BS Anggrek",
    nasabah: "NSB-005",
    petugas: "petugas3@peser.local",
    hariLalu: 3,
    items: [
      { jenis: 103, berat: 18, kondisi: "BERSIH" },
      { jenis: 202, berat: 12, kondisi: "BERSIH" },
    ],
  },
]

/**
 * Ambang jemput per bank sampah per jenis (PRD §8 baris 1028 memakai 50 kg
 * sebagai default). Yang tidak disebut di sini tetap 0 — artinya "belum
 * diatur", bukan "nol kilogram" (lihat levelStock di src/lib/level-stock.ts).
 *
 * BS Anggrek sengaja dibiarkan tanpa ambang supaya level TERISI ikut muncul di
 * peta, dan BS Kenanga tanpa setoran sama sekali supaya level KOSONG muncul.
 */
export const THRESHOLD: SeedThreshold[] = [
  { bankSampah: "BS Mawar", jenis: 101, threshold: 50 },
  { bankSampah: "BS Mawar", jenis: 201, threshold: 40 },
  { bankSampah: "BS Mawar", jenis: 301, threshold: 20 },
  { bankSampah: "BS Melati", jenis: 101, threshold: 50 },
  { bankSampah: "BS Melati", jenis: 102, threshold: 40 },
  { bankSampah: "BS Melati", jenis: 201, threshold: 60 },
]

// ---------------------------------------------------------------------------

export type RingkasanSeed = {
  bankSampah: string
  berat: number
  threshold: number
  level: LevelStock
}

/**
 * Hitung level peta yang DIHARAPKAN dari data seed, tanpa menyentuh database.
 *
 * Dipakai dua kali: tes invarian memastikan keempat level tercakup, dan
 * prisma/seed.ts mencetaknya sebagai laporan hasil. Satu perhitungan untuk
 * keduanya, jadi laporan seed tidak bisa mengklaim sesuatu yang tidak diuji.
 *
 * Agregasinya mengikuti src/lib/peta.ts: total seluruh jenis per bank sampah.
 */
export function ringkasanSeed(): RingkasanSeed[] {
  const bulat = (n: number) => Math.round(n * 100) / 100

  return BANK_SAMPAH.map((bs) => {
    const berat = SETORAN.filter((s) => s.bankSampah === bs.nama).reduce(
      (a, s) => a + s.items.reduce((b, i) => b + i.berat, 0),
      0,
    )
    const threshold = THRESHOLD.filter((t) => t.bankSampah === bs.nama).reduce(
      (a, t) => a + t.threshold,
      0,
    )
    return {
      bankSampah: bs.nama,
      berat: bulat(berat),
      threshold: bulat(threshold),
      level: levelStock({ berat, threshold }),
    }
  })
}

/** Harga jenis sampah menurut kodenya — untuk snapshot BR-09 saat menulis. */
export function hargaJenis(kode: number): number {
  const jenis = JENIS_SAMPAH.find((j) => j.kode === kode)
  if (!jenis) throw new Error(`Jenis sampah kode ${kode} tidak ada di data seed`)
  return jenis.harga
}
