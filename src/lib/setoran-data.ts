// View-model + label/style/formatter untuk fitur Setoran.
// Data asli di-query dari Prisma oleh Server Component, lalu diteruskan
// sebagai props ke komponen client. Modul ini sengaja tidak mengimpor
// apa pun agar aman dipakai di kedua sisi.

export type KondisiSampah = "BERSIH" | "KOTOR" | "CAMPUR";

export const KONDISI_SAMPAH_LABEL: Record<KondisiSampah, string> = {
  BERSIH: "Bersih",
  KOTOR: "Kotor",
  CAMPUR: "Campur",
};

export const KONDISI_SAMPAH_OPTIONS = [
  { value: "BERSIH", label: "Bersih" },
  { value: "KOTOR", label: "Kotor" },
  { value: "CAMPUR", label: "Campur" },
];

// --- Gerbang kualitas (FR-C2, BR-18) --------------------------------------

export type AlasanTolak =
  | "TIDAK_TERSORTIR"
  | "TIDAK_SESUAI_MASTER"
  | "TERKONTAMINASI"
  | "LAINNYA";

export const ALASAN_TOLAK_LABEL: Record<AlasanTolak, string> = {
  TIDAK_TERSORTIR: "Belum tersortir",
  TIDAK_SESUAI_MASTER: "Tidak ada di master jenis",
  TERKONTAMINASI: "Terkontaminasi",
  LAINNYA: "Lainnya",
};

/** Penjelasan singkat di bawah pilihan, supaya petugas memilih yang tepat. */
export const ALASAN_TOLAK_KETERANGAN: Record<AlasanTolak, string> = {
  TIDAK_TERSORTIR: "Masih campur, belum dipisah per jenis",
  TIDAK_SESUAI_MASTER: "Jenisnya belum terdaftar di master jenis sampah",
  TERKONTAMINASI: "Basah, berminyak, atau bercampur sisa makanan",
  LAINNYA: "Sebutkan alasannya di catatan",
};

export const ALASAN_TOLAK_OPTIONS = (
  Object.keys(ALASAN_TOLAK_LABEL) as AlasanTolak[]
).map((value) => ({ value, label: ALASAN_TOLAK_LABEL[value] }));

/** PRD §4.1: alasan LAINNYA tidak berguna tanpa catatan yang menjelaskannya. */
export const ALASAN_BUTUH_CATATAN: AlasanTolak = "LAINNYA";

export type SetoranDitolak = {
  id: string;
  jenisSampah: string | null;
  jenisSampahId: string | null;
  deskripsi: string;
  berat: number;
  alasan: AlasanTolak;
  catatan: string | null;
};

// Bentuk serializable: Decimal Prisma sudah dikonversi ke number,
// DateTime ke string ISO, sebelum dikirim ke Client Component.
export type SetoranItem = {
  id: string;
  jenisSampah: string;
  jenisSampahId: string;
  berat: number;
  hargaSaatItu: number;
  subtotal: number;
  kondisi: KondisiSampah;
};

export type Setoran = {
  id: string;
  kodeTransaksi: string;
  bankSampah: string;
  bankSampahId: string;
  nasabah: string;
  nasabahId: string;
  petugas: string;
  petugasId: string;
  totalBerat: number;
  totalNilai: number;
  cashDibayar: boolean;
  tanggal: string;
  idempotencyKey: string;
  items: SetoranItem[];
};

const KONDISI_STYLES: Record<KondisiSampah, string> = {
  BERSIH: "bg-secondary-container text-on-secondary-container border border-secondary/20",
  KOTOR: "bg-error-container text-on-error-container border border-error",
  CAMPUR: "bg-tertiary-container text-on-tertiary-container border border-tertiary",
};

export function kondisiStyle(kondisi: KondisiSampah): string {
  return KONDISI_STYLES[kondisi];
}

// Pemformat dulu didefinisikan di sini; sekarang satu-satunya sumber adalah
// @/lib/format.ts. formatCurrency lokal sempat lupa maximumFractionDigits,
// jadi Rp 15.000,5 tampil apa adanya di layar ini sementara layar lain
// membulatkannya ke Rp 15.001 — nilai sama, dua tampilan.
