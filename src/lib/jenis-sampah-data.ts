export type JenisSampah = {
  id: string;
  kode: number;
  nama: string;
  kategori: string;
  satuan: string;
  harga: number;
  deskripsi: string | null;
  isActive: boolean;
};

export const KATEGORI = [
  { value: "PLASTIK", label: "Plastik" },
  { value: "KERTAS", label: "Kertas" },
  { value: "KACA", label: "Kaca" },
  { value: "LOGAM", label: "Logam" },
];

export const SATUAN = [
  { value: "KG", label: "Kilogram" },
  { value: "PCS", label: "Pieces" },
];

export type JenisSampahStatus = "Aktif" | "Non-aktif";
