import { BANK_SAMPAH } from "@/lib/bank-sampah-data";

export type Nasabah = {
  id: string;
  bankSampahId: string;
  nama: string;
  noHp: string;
  alamat: string;
  rt: string;
  rw: string;
  setoranId: string;
};

export const NASABAH_BANK_SAMPAH_OPTIONS = BANK_SAMPAH.map((b) => ({
  value: b.id,
  label: b.nama,
}));

export function getBankSampahName(bankSampahId: string) {
  return BANK_SAMPAH.find((b) => b.id === bankSampahId)?.nama ?? bankSampahId;
}

export const NASABAH: Nasabah[] = [
  {
    id: "NBS-001",
    bankSampahId: "BS-MLY-01",
    nama: "Rina Marlina",
    noHp: "81211112222",
    alamat: "Jl. Teuku Umar No. 10",
    rt: "01",
    rw: "05",
    setoranId: "STN-2026-001",
  },
  {
    id: "NBS-002",
    bankSampahId: "BS-MLY-01",
    nama: "Bambang Priyono",
    noHp: "81333334444",
    alamat: "Jl. Cik Ditiro No. 22",
    rt: "03",
    rw: "07",
    setoranId: "STN-2026-002",
  },
  {
    id: "NBS-003",
    bankSampahId: "BS-HJU-02",
    nama: "Siti Nurhaliza",
    noHp: "81555556666",
    alamat: "Jl. Asia Afrika No. 8",
    rt: "02",
    rw: "04",
    setoranId: "STN-2026-003",
  },
  {
    id: "NBS-004",
    bankSampahId: "BS-HJU-02",
    nama: "Agus Salim",
    noHp: "81777778888",
    alamat: "Jl. Bendungan Hilir No. 15",
    rt: "05",
    rw: "09",
    setoranId: "STN-2026-004",
  },
  {
    id: "NBS-005",
    bankSampahId: "BS-BRH-03",
    nama: "Dewi Lestari",
    noHp: "81999990000",
    alamat: "Jl. Raden Saleh No. 31",
    rt: "04",
    rw: "06",
    setoranId: "STN-2026-005",
  },
];