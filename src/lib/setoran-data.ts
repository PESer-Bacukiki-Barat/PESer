import { BANK_SAMPAH } from "@/lib/bank-sampah-data";

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

export function getNasabahName(nasabahId: string): string {
  return nasabahId;
}

export function getPetugasName(petugasId: string): string {
  return petugasId;
}

export function getJenisSampahName(jenisSampahId: string): string {
  return jenisSampahId;
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

export const SETORAN: Setoran[] = [
  {
    id: "STN-2026-001",
    kodeTransaksi: "STN-2026-001",
    bankSampah: "Bank Sampah Melati",
    bankSampahId: "BS-MLY-01",
    nasabah: "Rina Marlina",
    nasabahId: "NBS-001",
    petugas: "Budi Santoso",
    petugasId: "budi.santoso@peser.id",
    totalBerat: 12.5,
    totalNilai: 375000,
    cashDibayar: true,
    tanggal: "2026-08-20T09:00:00.000Z",
    idempotencyKey: "idem-stn-001",
    items: [
      {
        id: "STI-001-1",
        jenisSampah: "Botol PET Bening",
        jenisSampahId: "PLS-001",
        berat: 10.0,
        hargaSaatItu: 25000,
        subtotal: 250000,
        kondisi: "BERSIH",
      },
      {
        id: "STI-001-2",
        jenisSampah: "Gelas Plastik (PP)",
        jenisSampahId: "PLS-002",
        berat: 2.5,
        hargaSaatItu: 50000,
        subtotal: 125000,
        kondisi: "BERSIH",
      },
    ],
  },
  {
    id: "STN-2026-002",
    kodeTransaksi: "STN-2026-002",
    bankSampah: "Bank Sampah Melati",
    bankSampahId: "BS-MLY-01",
    nasabah: "Bambang Priyono",
    nasabahId: "NBS-002",
    petugas: "Budi Santoso",
    petugasId: "budi.santoso@peser.id",
    totalBerat: 8.0,
    totalNilai: 160000,
    cashDibayar: true,
    tanggal: "2026-08-19T10:30:00.000Z",
    idempotencyKey: "idem-stn-002",
    items: [
      {
        id: "STI-002-1",
        jenisSampah: "Gelas Plastik (PP)",
        jenisSampahId: "PLS-002",
        berat: 8.0,
        hargaSaatItu: 20000,
        subtotal: 160000,
        kondisi: "KOTOR",
      },
    ],
  },
  {
    id: "STN-2026-003",
    kodeTransaksi: "STN-2026-003",
    bankSampah: "Bank Sampah Hijau",
    bankSampahId: "BS-HJU-02",
    nasabah: "Siti Nurhaliza",
    nasabahId: "NBS-003",
    petugas: "Ahmad Wijaya",
    petugasId: "ahmad.wijaya@peser.id",
    totalBerat: 15.75,
    totalNilai: 472500,
    cashDibayar: false,
    tanggal: "2026-08-21T08:15:00.000Z",
    idempotencyKey: "idem-stn-003",
    items: [
      {
        id: "STI-003-1",
        jenisSampah: "Botol PET Bening",
        jenisSampahId: "PLS-001",
        berat: 12.5,
        hargaSaatItu: 25000,
        subtotal: 312500,
        kondisi: "BERSIH",
      },
      {
        id: "STI-003-2",
        jenisSampah: "Kardus Campur",
        jenisSampahId: "KRT-001",
        berat: 3.25,
        hargaSaatItu: 50000,
        subtotal: 162500,
        kondisi: "CAMPUR",
      },
    ],
  },
  {
    id: "STN-2026-004",
    kodeTransaksi: "STN-2026-004",
    bankSampah: "Bank Sampah Hijau",
    bankSampahId: "BS-HJU-02",
    nasabah: "Agus Salim",
    nasabahId: "NBS-004",
    petugas: "Ahmad Wijaya",
    petugasId: "ahmad.wijaya@peser.id",
    totalBerat: 5.5,
    totalNilai: 110000,
    cashDibayar: true,
    tanggal: "2026-08-18T14:20:00.000Z",
    idempotencyKey: "idem-stn-004",
    items: [
      {
        id: "STI-004-1",
        jenisSampah: "Kardus Campur",
        jenisSampahId: "KRT-001",
        berat: 5.5,
        hargaSaatItu: 20000,
        subtotal: 110000,
        kondisi: "BERSIH",
      },
    ],
  },
  {
    id: "STN-2026-005",
    kodeTransaksi: "STN-2026-005",
    bankSampah: "Bank Sampah Bersih",
    bankSampahId: "BS-BRH-03",
    nasabah: "Dewi Lestari",
    nasabahId: "NBS-005",
    petugas: "",
    petugasId: "",
    totalBerat: 20.0,
    totalNilai: 600000,
    cashDibayar: false,
    tanggal: "2026-08-22T07:45:00.000Z",
    idempotencyKey: "idem-stn-005",
    items: [
      {
        id: "STI-005-1",
        jenisSampah: "Botol PET Bening",
        jenisSampahId: "PLS-001",
        berat: 20.0,
        hargaSaatItu: 30000,
        subtotal: 600000,
        kondisi: "BERSIH",
      },
    ],
  },
];

export { BANK_SAMPAH as BANK_SAMPAH_UNTUK_SETORAN };
