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

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatCurrency(value: number | null | undefined): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
}

export function formatDateSetoran(dateStr: string): string {
  return formatDate(dateStr);
}
