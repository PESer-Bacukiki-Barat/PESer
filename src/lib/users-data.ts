export type Role = "ADMIN" | "PETUGAS"

export type UserRow = {
  id: string
  email: string
  nama: string
  /** Jangkar penautan akun ke Nasabah di area warga (lihat nasabah-tertaut.ts). */
  noHp: string | null
  role: Role
  bankSampahId: string | null
  isActive: boolean
  bankSampah?: { id: string; nama: string } | null
  createdAt?: string
  updatedAt?: string
  deletedAt?: string | null
}

export type UserPayload = {
  email: string
  password?: string
  nama: string
  noHp?: string | null
  role: Role
  bankSampahId?: string | null
  isActive?: boolean
}

export const ROLE_OPTIONS = [
  { value: "ADMIN", label: "Admin" },
  { value: "PETUGAS", label: "Petugas" },
]

export const STATUS_OPTIONS = [
  { value: "true", label: "Aktif" },
  { value: "false", label: "Non-Aktif" },
]

const AVATAR_CLASSES = [
  "bg-primary-container text-on-primary-container",
  "bg-secondary-container text-on-secondary-container",
  "bg-tertiary-container text-on-tertiary-container",
  "bg-surface-container-high text-on-surface",
]

export function initialsOf(nama: string): string {
  return nama
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("")
}

export function initialsClassOf(index: number): string {
  return AVATAR_CLASSES[index % AVATAR_CLASSES.length]
}
