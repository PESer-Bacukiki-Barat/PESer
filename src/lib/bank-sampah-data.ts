export type BankSampahStatus = "Active" | "Non-aktif";

export type BankSampah = {
  id: string;
  nama: string;
  kelurahan: string;
  alamat: string;
  latitude: number;
  longitude: number;
  status: BankSampahStatus;
};

export const KELURAHAN = [
  { value: "Menteng", label: "Menteng" },
  { value: "Senayan", label: "Senayan" },
  { value: "Cikini", label: "Cikini" },
];

export const BANK_SAMPAH: BankSampah[] = [
  {
    id: "BS-MLY-01",
    nama: "Bank Sampah Melati",
    kelurahan: "Menteng",
    alamat: "Jl. Teuku Umar No. 10",
    latitude: -6.1894,
    longitude: 106.8324,
    status: "Active",
  },
  {
    id: "BS-HJU-02",
    nama: "Bank Sampah Hijau",
    kelurahan: "Senayan",
    alamat: "Jl. Asia Afrika",
    latitude: -6.2235,
    longitude: 106.7992,
    status: "Active",
  },
  {
    id: "BS-BRH-03",
    nama: "Bank Sampah Bersih",
    kelurahan: "Cikini",
    alamat: "Jl. Raden Saleh",
    latitude: -6.1915,
    longitude: 106.8398,
    status: "Non-aktif",
  },
];