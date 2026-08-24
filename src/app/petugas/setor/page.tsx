import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { prisma } from "@/lib/prisma"
import { getServerUser } from "@/lib/auth"
import { SetorForm, type JenisOpsi, type NasabahOpsi } from "./setor-form"

export const metadata: Metadata = {
  title: "Setor Sampah",
}

export const dynamic = "force-dynamic"

export default async function SetorPage() {
  const user = await getServerUser()
  if (!user?.bankSampahId) redirect("/petugas")
  const bankSampahId = user.bankSampahId

  const [nasabahRows, jenisRows] = await Promise.all([
    // Scope dari sesi, bukan dari query (§2.5 aturan 4).
    prisma.nasabah.findMany({
      where: { bankSampahId, deletedAt: null, isActive: true },
      orderBy: { nama: "asc" },
      select: { id: true, kodeNasabah: true, nama: true },
    }),
    // BR-16: jenis sampah berharga 0 tidak boleh muncul di form setoran.
    prisma.jenisSampah.findMany({
      where: { deletedAt: null, isActive: true, harga: { gt: 0 } },
      orderBy: { nama: "asc" },
      select: { id: true, nama: true, harga: true },
    }),
  ])

  const nasabah: NasabahOpsi[] = nasabahRows
  const jenis: JenisOpsi[] = jenisRows.map((j) => ({
    id: j.id,
    nama: j.nama,
    harga: Number(j.harga),
  }))

  return (
    <>
      <div className="mb-4">
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
          Setor Sampah
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant mt-1">
          Timbang, catat per jenis, lalu serahkan tunai ke warga.
        </p>
      </div>
      <SetorForm nasabah={nasabah} jenis={jenis} />
    </>
  )
}
