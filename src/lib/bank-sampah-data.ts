export type BankSampah = {
  id: string
  nama: string
  kelurahanId: string
  kelurahanNama?: string | null
  alamat: string
  latitude: number
  longitude: number
  isActive: boolean
  createdAt?: string
  updatedAt?: string
  deletedAt?: string | null
}

export type BankSampahPayload = {
  nama: string
  kelurahanId: string
  alamat: string
  latitude: number
  longitude: number
  isActive?: boolean
}

export type BankSampahStatus = "Active" | "Non-aktif"

// ponytail: static fallback for the (still mock) nasabah dropdown; only id/nama are read.
export const BANK_SAMPAH: BankSampah[] = [
  {
    id: "BS-MLY-01",
    nama: "Bank Sampah Melati",
    kelurahanId: "k-menteng",
    alamat: "Jl. Teuku Umar No. 10",
    latitude: -6.1894,
    longitude: 106.8324,
    isActive: true,
  },
  {
    id: "BS-HJU-02",
    nama: "Bank Sampah Hijau",
    kelurahanId: "k-senayan",
    alamat: "Jl. Asia Afrika",
    latitude: -6.2235,
    longitude: 106.7992,
    isActive: true,
  },
  {
    id: "BS-BRH-03",
    nama: "Bank Sampah Bersih",
    kelurahanId: "k-cikini",
    alamat: "Jl. Raden Saleh",
    latitude: -6.1915,
    longitude: 106.8398,
    isActive: false,
  },
]
