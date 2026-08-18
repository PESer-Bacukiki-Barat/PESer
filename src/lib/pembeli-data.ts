export type PembeliStatus = "Aktif" | "Non-aktif";

export type Pembeli = {
  id: string;
  nama: string;
  perusahaan: string;
  noHp: string;
  alamat: string;
  catatan: string;
  status: PembeliStatus;
};

export const PERUSAHAAN = [
  { value: "PT Daur Ulang Sejahtera", label: "PT Daur Ulang Sejahtera" },
  { value: "CV Kertas Jaya", label: "CV Kertas Jaya" },
];

export const PEMBELI: Pembeli[] = [
  {
    id: "P-001",
    nama: "Andi Wijaya",
    perusahaan: "PT Daur Ulang Sejahtera",
    noHp: "81211112222",
    alamat: "Jl. Industri No. 5",
    catatan: "Pembeli rutin plastik",
    status: "Aktif",
  },
  {
    id: "P-002",
    nama: "Siti Aminah",
    perusahaan: "CV Kertas Jaya",
    noHp: "81333334444",
    alamat: "Pergudangan B-12",
    catatan: "-",
    status: "Non-aktif",
  },
];