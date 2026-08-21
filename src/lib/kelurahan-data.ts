export type Kelurahan = {
  id: string
  nama: string
  kodeWilayah: string
  createdAt?: string
  updatedAt?: string
  deletedAt?: string | null
}

export type KelurahanPayload = {
  nama: string
  kodeWilayah: string
}
