export type PetugasStatus = "Aktif" | "Non-Aktif";

export type Petugas = {
  initials: string;
  initialsClass: string;
  nama: string;
  nip: string;
  unitKerja: string;
  noHp: string;
  status: PetugasStatus;
  email: string;
  alamat: string;
  foto: File | string | null;
};

export const UNIT_KERJA = [
  { value: "Kelurahan Menteng", label: "Kelurahan Menteng" },
  { value: "Kelurahan Senayan", label: "Kelurahan Senayan" },
  { value: "Kelurahan Cikini", label: "Kelurahan Cikini" },
];

export const PETUGAS: Petugas[] = [
  {
    initials: "BS",
    initialsClass: "bg-primary-container text-on-primary-container",
    nama: "Budi Santoso",
    nip: "ID-00124",
    unitKerja: "Kelurahan Menteng",
    noHp: "81234567890",
    status: "Aktif",
    email: "budi.santoso@peser.id",
    alamat: "Jl. Haji Agus Salim No. 12, RT 01/RW 05, Menteng, Jakarta Pusat",
    foto: null,
  },
  {
    initials: "SR",
    initialsClass: "bg-surface-container-high text-on-surface",
    nama: "Siti Rahma",
    nip: "ID-00125",
    unitKerja: "Kelurahan Senayan",
    noHp: "85678901234",
    status: "Non-Aktif",
    email: "siti.rahma@peser.id",
    alamat: "Jl. Asia Afrika No. 8, Senayan, Jakarta Selatan",
    foto: null,
  },
  {
    initials: "AW",
    initialsClass: "bg-secondary-container text-on-secondary-container",
    nama: "Ahmad Wijaya",
    nip: "ID-00126",
    unitKerja: "Kelurahan Cikini",
    noHp: "81355559999",
    status: "Aktif",
    email: "ahmad.wijaya@peser.id",
    alamat: "Jl. Cikini Raya No. 21, Cikini, Jakarta Pusat",
    foto: null,
  },
];