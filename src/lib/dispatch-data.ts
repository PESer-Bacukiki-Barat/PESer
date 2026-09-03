// View-model + label/style untuk fitur Dispatch.
// Data asli di-query dari Prisma oleh Server Component, lalu diteruskan
// sebagai props ke komponen client (Next.js 16 melarang mengirim fungsi
// dari Server ke Client Component). Modul ini sengaja tidak mengimpor
// apa pun agar aman dipakai di kedua sisi.

export type DispatchStatus =
  | "DRAFT"
  | "DISPATCHED"
  | "DITERIMA"
  | "DITOLAK"
  | "SERAH_TERIMA"
  | "SELESAI"
  | "DIBATALKAN";

export const DISPATCH_STATUS_LABEL: Record<DispatchStatus, string> = {
  DRAFT: "Draft",
  DISPATCHED: "Diproses",
  DITERIMA: "Diterima",
  DITOLAK: "Ditolak",
  SERAH_TERIMA: "Serah Terima",
  SELESAI: "Selesai",
  DIBATALKAN: "Dibatalkan",
};

const STATUS_STYLES: Record<DispatchStatus, string> = {
  DRAFT: "bg-surface-dim text-on-surface-variant border border-outline-variant",
  DISPATCHED:
    "bg-surface-container-highest text-on-surface-variant border border-outline-variant",
  DITERIMA:
    "bg-secondary-container text-on-secondary-container border border-secondary-fixed",
  DITOLAK: "bg-error-container text-on-error-container border border-error",
  SERAH_TERIMA:
    "bg-tertiary-container text-on-tertiary-container border border-tertiary",
  SELESAI:
    "bg-secondary-container text-on-secondary-container border border-secondary-fixed",
  DIBATALKAN:
    "bg-surface-variant text-on-surface-variant border border-outline-variant",
};

export function statusStyle(status: DispatchStatus): string {
  return STATUS_STYLES[status];
}

// Bentuk serializable: Decimal Prisma sudah dikonversi ke number,
// DateTime ke string ISO, sebelum dikirim ke Client Component.
export type DispatchItem = {
  id: string;
  jenisSampah: string;
  jenisSampahId: string;
  beratTarget: number;
  beratAktual: number | null;
  hargaJualPerKg: number;
  subtotal: number | null;
};

export type Dispatch = {
  id: string;
  kodeDispatch: string;
  bankSampah: string;
  bankSampahId: string;
  pembeli: string;
  pembeliId: string;
  status: DispatchStatus;
  tanggalJemput: string;
  totalNilai: number | null;
  alasanTolak: string | null;
  alasanSelisih: string | null;
  selisihSignifikan: boolean;
  items: DispatchItem[];
};

// Opsi dropdown form, dibangun Server Component dari data Prisma
// (bank sampah / pembeli / jenis sampah yang masih aktif).
export type SelectOptionData = { value: string; label: string };

export type DispatchFormOptions = {
  bankSampah: SelectOptionData[];
  pembeli: SelectOptionData[];
  jenisSampah: SelectOptionData[];
};

export type DispatchFormValues = {
  bankSampahId: string;
  pembeliId: string;
  tanggalJemput: string;
  items: {
    jenisSampahId: string;
    beratTarget: string;
    hargaJualPerKg: string;
  }[];
  alasan: string;
};

export { DISPATCH_STATUS_LABEL as STATUS_LABEL, statusStyle as getStatusStyle };
