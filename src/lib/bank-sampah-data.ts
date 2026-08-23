export type BankSampahStatus = "Active" | "Non-aktif";

export type BankSampahStockItem = {
  jenisSampah: string;
  jenisSampahId: string;
  berat: number;
  beratReservasi: number;
};

export type BankSampah = {
  id: string;
  nama: string;
  kelurahan: string;
  alamat: string;
  latitude: number;
  longitude: number;
  status: BankSampahStatus;
  // Stock dihitung dari transaksi (Setoran/Dispatch/Koreksi), bukan input CRUD.
  // Mencerminkan total berat per jenis yang tersedia (berat - beratReservasi).
  stock: BankSampahStockItem[];
};

export const KELURAHAN = [
  { value: "Menteng", label: "Menteng" },
  { value: "Senayan", label: "Senayan" },
  { value: "Cikini", label: "Cikini" },
];

export function formatNumber(value: number | null | undefined): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function stockTotalBerat(stock: BankSampahStockItem[]): number {
  return stock.reduce((sum, s) => sum + s.berat, 0);
}

export function stockTotalTersedia(stock: BankSampahStockItem[]): number {
  return stock.reduce((sum, s) => sum + Math.max(0, s.berat - s.beratReservasi), 0);
}

export const BANK_SAMPAH: BankSampah[] = [
  {
    id: "BS-MLY-01",
    nama: "Bank Sampah Melati",
    kelurahan: "Menteng",
    alamat: "Jl. Teuku Umar No. 10",
    latitude: -6.1894,
    longitude: 106.8324,
    status: "Active",
    stock: [
      { jenisSampah: "Botol PET Bening", jenisSampahId: "PLS-001", berat: 10.0, beratReservasi: 0 },
      { jenisSampah: "Gelas Plastik (PP)", jenisSampahId: "PLS-002", berat: 10.5, beratReservasi: 2.5 },
    ],
  },
  {
    id: "BS-HJU-02",
    nama: "Bank Sampah Hijau",
    kelurahan: "Senayan",
    alamat: "Jl. Asia Afrika",
    latitude: -6.2235,
    longitude: 106.7992,
    status: "Active",
    stock: [
      { jenisSampah: "Botol PET Bening", jenisSampahId: "PLS-001", berat: 12.5, beratReservasi: 0 },
      { jenisSampah: "Kardus Campur", jenisSampahId: "KRT-001", berat: 8.75, beratReservasi: 0 },
    ],
  },
  {
    id: "BS-BRH-03",
    nama: "Bank Sampah Bersih",
    kelurahan: "Cikini",
    alamat: "Jl. Raden Saleh",
    latitude: -6.1915,
    longitude: 106.8398,
    status: "Non-aktif",
    stock: [],
  },
];