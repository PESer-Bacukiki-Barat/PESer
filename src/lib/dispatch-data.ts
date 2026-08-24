import { BANK_SAMPAH } from "@/lib/bank-sampah-data";
import { JENIS_SAMPAH } from "@/lib/jenis-sampah-data";
import { PEMBELI } from "@/lib/pembeli-data";

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

export const DISPATCH_STATUS_OPTIONS = [
  { value: "DRAFT", label: "Draft" },
  { value: "DISPATCHED", label: "Diproses" },
  { value: "DITERIMA", label: "Diterima" },
  { value: "DITOLAK", label: "Ditolak" },
  { value: "SERAH_TERIMA", label: "Serah Terima" },
  { value: "SELESAI", label: "Selesai" },
  { value: "DIBATALKAN", label: "Dibatalkan" },
];

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

export type DispatchItem = {
  id: string;
  jenisSampah: string;
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

export const BANK_SAMPAH_OPTIONS = BANK_SAMPAH.filter((b) => b.status === "Active").map(
  (b) => ({ value: b.id, label: b.nama }),
);

export const PEMBELI_OPTIONS = PEMBELI.filter((p) => p.status === "Aktif").map((p) => ({
  value: p.id,
  label: p.nama,
}));

export const JENIS_SAMPAH_OPTIONS = JENIS_SAMPAH.filter((j) => j.status === "Aktif").map(
  (j) => ({ value: j.kode, label: j.nama }),
);

export const DISPATCH: Dispatch[] = [
  {
    id: "DSP-001",
    kodeDispatch: "DSP-202310-001",
    bankSampah: "BS Mawar",
    bankSampahId: "BS-MLY-01",
    pembeli: "PT Daur Ulang Jaya",
    pembeliId: "P-001",
    status: "SELESAI",
    tanggalJemput: "2023-10-24T08:00:00.000Z",
    totalNilai: 1500000,
    alasanTolak: null,
    alasanSelisih: null,
    selisihSignifikan: false,
    items: [
      {
        id: "DSI-001",
        jenisSampah: "Botol PET Bening",
        beratTarget: 50,
        beratAktual: 48,
        hargaJualPerKg: 30000,
        subtotal: 1440000,
      },
      {
        id: "DSI-002",
        jenisSampah: "Gelas Plastik (PP)",
        beratTarget: 2,
        beratAktual: 2,
        hargaJualPerKg: 20000,
        subtotal: 40000,
      },
    ],
  },
  {
    id: "DSP-002",
    kodeDispatch: "DSP-202310-002",
    bankSampah: "BS Melati",
    bankSampahId: "BS-HJU-02",
    pembeli: "UD Plastik Makmur",
    pembeliId: "P-002",
    status: "DITERIMA",
    tanggalJemput: "2023-10-25T09:00:00.000Z",
    totalNilai: 850000,
    alasanTolak: null,
    alasanSelisih: null,
    selisihSignifikan: false,
    items: [
      {
        id: "DSI-003",
        jenisSampah: "Botol PET Bening",
        beratTarget: 25,
        beratAktual: null,
        hargaJualPerKg: 30000,
        subtotal: null,
      },
      {
        id: "DSI-004",
        jenisSampah: "Kardus Campur",
        beratTarget: 5,
        beratAktual: null,
        hargaJualPerKg: 15000,
        subtotal: null,
      },
    ],
  },
  {
    id: "DSP-003",
    kodeDispatch: "DSP-202310-003",
    bankSampah: "BS Anggrek",
    bankSampahId: "BS-BRH-03",
    pembeli: "Koperasi Kertas",
    pembeliId: "P-001",
    status: "DITOLAK",
    tanggalJemput: "2023-10-26T10:00:00.000Z",
    totalNilai: 320000,
    alasanTolak: "Jumlah stock tidak mencukupi",
    alasanSelisih: null,
    selisihSignifikan: false,
    items: [
      {
        id: "DSI-005",
        jenisSampah: "Botol PET Bening",
        beratTarget: 10,
        beratAktual: null,
        hargaJualPerKg: 30000,
        subtotal: null,
      },
    ],
  },
  {
    id: "DSP-004",
    kodeDispatch: "DSP-202310-004",
    bankSampah: "BS Mawar",
    bankSampahId: "BS-MLY-01",
    pembeli: "CV Kertas Jaya",
    pembeliId: "P-002",
    status: "DISPATCHED",
    tanggalJemput: "2023-10-27T08:30:00.000Z",
    totalNilai: 900000,
    alasanTolak: null,
    alasanSelisih: null,
    selisihSignifikan: false,
    items: [
      {
        id: "DSI-006",
        jenisSampah: "Gelas Plastik (PP)",
        beratTarget: 30,
        beratAktual: null,
        hargaJualPerKg: 20000,
        subtotal: null,
      },
    ],
  },
  {
    id: "DSP-005",
    kodeDispatch: "DSP-202310-005",
    bankSampah: "BS Melati",
    bankSampahId: "BS-HJU-02",
    pembeli: "PT Daur Ulang Jaya",
    pembeliId: "P-001",
    status: "DRAFT",
    tanggalJemput: "2023-10-28T07:00:00.000Z",
    totalNilai: 1200000,
    alasanTolak: null,
    alasanSelisih: null,
    selisihSignifikan: false,
    items: [
      {
        id: "DSI-007",
        jenisSampah: "Botol PET Bening",
        beratTarget: 40,
        beratAktual: null,
        hargaJualPerKg: 30000,
        subtotal: null,
      },
    ],
  },
];

export { DISPATCH_STATUS_LABEL as STATUS_LABEL, statusStyle as getStatusStyle };
