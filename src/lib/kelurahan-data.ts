export type KelurahanStatus = "Aktif" | "Non-aktif";

export type Kelurahan = {
  id: string;
  name: string;
  kecamatan: string;
  bankSampah: number;
  status: KelurahanStatus;
};

export const KELURAHAN: Kelurahan[] = [
  {
    id: "KBY-001",
    name: "Cipete Utara",
    kecamatan: "Kebayoran Baru",
    bankSampah: 12,
    status: "Aktif",
  },
  {
    id: "KBY-002",
    name: "Gandaria Utara",
    kecamatan: "Kebayoran Baru",
    bankSampah: 8,
    status: "Aktif",
  },
  {
    id: "KBY-003",
    name: "Pulo",
    kecamatan: "Kebayoran Baru",
    bankSampah: 3,
    status: "Non-aktif",
  },
  {
    id: "KBY-004",
    name: "Melawai",
    kecamatan: "Kebayoran Baru",
    bankSampah: 5,
    status: "Aktif",
  },
];