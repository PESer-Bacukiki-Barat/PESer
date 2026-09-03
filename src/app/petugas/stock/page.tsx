import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { prisma } from "@/lib/prisma"
import { getServerUser } from "@/lib/auth"
import { markerBankSampah } from "@/lib/peta"
import { GAYA_LEVEL } from "@/lib/level-stock"
import { PetaBankSampah } from "@/components/peta/peta-bank-sampah"
import { fmtBerat } from "@/lib/format"
import { Package } from "lucide-react"
import { KeadaanKosong } from "@/components/ui/keadaan-kosong"

export const metadata: Metadata = {
  title: "Stock",
}

export const dynamic = "force-dynamic"

/** Stock bank sampah sendiri — FR-C5. */
export default async function StockPetugasPage() {
  const user = await getServerUser()
  if (!user?.bankSampahId) redirect("/petugas")

  // §2.4: petugas hanya melihat bank sampahnya sendiri di peta, jadi id-nya
  // datang dari sesi — bukan dari query string yang bisa ditukar.
  const [marker] = await markerBankSampah(user.bankSampahId)

  const stock = await prisma.stock.findMany({
    where: { bankSampahId: user.bankSampahId },
    orderBy: { jenisSampah: { nama: "asc" } },
    select: {
      id: true,
      berat: true,
      beratReservasi: true,
      threshold: true,
      updatedAt: true,
      jenisSampah: { select: { nama: true } },
    },
  })

  const total = stock.reduce((a, s) => a + Number(s.berat), 0)
  const reservasi = stock.reduce((a, s) => a + Number(s.beratReservasi), 0)

  return (
    <>
      <div className="mb-4">
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
          Stock
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant mt-1">
          Stock bank sampah Anda. Berubah otomatis dari setoran dan dispatch.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4">
          <p className="font-label-sm text-label-sm text-on-surface-variant">Total</p>
          <p className="text-headline-md font-mono font-semibold text-on-surface">
            {fmtBerat(total)} kg
          </p>
        </div>
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4">
          <p className="font-label-sm text-label-sm text-on-surface-variant">Tersedia</p>
          <p className="text-headline-md font-mono font-semibold text-on-surface">
            {fmtBerat(total - reservasi)} kg
          </p>
          {reservasi > 0 && (
            <p className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">
              {fmtBerat(reservasi)} kg ditahan dispatch
            </p>
          )}
        </div>
      </div>

      {marker && (
        <section aria-labelledby="lokasi-bank-sampah" className="mb-4">
          <h2
            id="lokasi-bank-sampah"
            className="mb-2 font-label-md text-label-md text-on-surface-variant"
          >
            Lokasi
          </h2>
          <PetaBankSampah markers={[marker]} height={200} />
          <p className="mt-2 flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2 py-0.5 font-label-sm text-label-sm ${GAYA_LEVEL[marker.level].badge}`}
            >
              {GAYA_LEVEL[marker.level].label}
            </span>
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              {GAYA_LEVEL[marker.level].keterangan}
            </span>
          </p>
        </section>
      )}

      {stock.length === 0 ? (
        <KeadaanKosong Ikon={Package} aksen="barang" judul="Gudang masih kosong">
          Stock terbentuk otomatis begitu setoran pertama dicatat.
        </KeadaanKosong>
      ) : (
        <ul className="space-y-2">
          {stock.map((s) => {
            const berat = Number(s.berat)
            const ditahan = Number(s.beratReservasi)
            const tersedia = berat - ditahan
            const threshold = Number(s.threshold)
            const lewatThreshold = threshold > 0 && berat >= threshold

            return (
              <li
                key={s.id}
                className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-label-md text-label-md text-on-surface truncate">
                      {s.jenisSampah.nama}
                    </p>
                    <p className="font-label-sm text-label-sm text-on-surface-variant">
                      Tersedia {fmtBerat(tersedia)} kg
                      {ditahan > 0 && ` · ${fmtBerat(ditahan)} kg ditahan`}
                    </p>
                  </div>
                  <p className="text-headline-md font-normal font-mono text-on-surface shrink-0">
                    {fmtBerat(berat)} kg
                  </p>
                </div>
                {lewatThreshold && (
                  <p className="mt-2 font-label-sm text-label-sm text-on-tertiary-container">
                    Sudah melewati ambang {fmtBerat(threshold)} kg — siap dijemput.
                  </p>
                )}
              </li>
            )
          })}
        </ul>
      )}

    </>
  )
}
