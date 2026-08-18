export type JenisSampahStatus = "Aktif" | "Non-aktif";

export type JenisSampah = {
  kode: string;
  nama: string;
  kategori: string;
  berat: number;
  deskripsi: string;
  status: JenisSampahStatus;
};

export const KATEGORI = [
  { value: "Plastik", label: "Plastik" },
  { value: "Kertas", label: "Kertas" },
  { value: "Kaca", label: "Kaca" },
  { value: "Logam", label: "Logam" },
];

export const JENIS_SAMPAH: JenisSampah[] = [
  {
    kode: "PLS-001",
    nama: "Botol PET Bening",
    kategori: "Plastik",
    berat: 0.5,
    deskripsi: "Botol plastik minuman mineral ukuran 600ml",
    status: "Aktif",
  },
  {
    kode: "PLS-002",
    nama: "Gelas Plastik (PP)",
    kategori: "Plastik",
    berat: 0.2,
    deskripsi: "Gelas plastik minuman kemasan",
    status: "Aktif",
  },
  {
    kode: "KRT-001",
    nama: "Kardus Campur",
    kategori: "Kertas",
    berat: 1.0,
    deskripsi: "Kardus bekas packing, kering",
    status: "Aktif",
  },
  {
    kode: "KCA-002",
    nama: "Pecahan Kaca",
    kategori: "Kaca",
    berat: 5.0,
    deskripsi: "Pecahan kaca campuran, bahaya",
    status: "Non-aktif",
  },
];