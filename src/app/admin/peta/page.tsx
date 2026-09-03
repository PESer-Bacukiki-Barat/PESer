import type { Metadata } from "next"
import Link from "next/link"
import { ChevronRight, Landmark } from "lucide-react"

import { markerBankSampah } from "@/lib/peta"
import { GAYA_LEVEL } from "@/lib/level-stock"
import { PetaBankSampah } from "@/components/peta/peta-bank-sampah"
import { LegendaLevel } from "@/components/peta/legenda-level"
import { DaftarMarker } from "@/components/peta/daftar-marker"
import { KeadaanKosong } from "@/components/ui/keadaan-kosong"

export const metadata: Metadata = {
  title: "Peta Sebaran",
}

/**
 * Level stock yang basi bisa membuat admin mengirim armada ke gudang yang
 * sudah kosong, jadi halaman ini tunduk pada larangan cache §4.3 yang sama
 * dengan halaman dispatch dan laporan.
 */
export const dynamic = "force-dynamic"
export const revalidate = 0

/** Peta sebaran bank sampah dengan warna marker per level stock — FR-E2. */
export default async function PetaAdminPage() {
  const markers = await markerBankSampah()
  const siapJemput = markers.filter((m) => m.level === "SIAP_JEMPUT" && m.isActive)

  return (
    <>
      <nav
        aria-label="Breadcrumb"
        className="mb-6 flex items-center gap-2 font-label-sm text-label-sm text-on-surface-variant"
      >
        <Link href="/admin" className="tekan-halus hover:text-primary">
          Dashboard
        </Link>
        <ChevronRight className="size-4" aria-hidden />
        <span className="text-on-surface">Peta Sebaran</span>
      </nav>

      <div className="mb-6">
        <h1 className="font-headline-lg text-headline-lg text-on-surface">
          Peta Sebaran
        </h1>
        <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
          Sebaran bank sampah se-kecamatan. Warna marker mengikuti level stock
          terhadap ambang jemputnya.
        </p>
      </div>

      {siapJemput.length > 0 && (
        <p
          className={`mb-4 rounded-xl px-4 py-3 font-body-md text-body-md ${GAYA_LEVEL.SIAP_JEMPUT.badge}`}
        >
          <strong>{siapJemput.length} bank sampah</strong> sudah melewati ambang
          jemput dan siap dibuatkan dispatch.
        </p>
      )}

      <div className="mb-6">
        <PetaBankSampah markers={markers} height={460} />
        <div className="mt-3">
          <LegendaLevel markers={markers} />
        </div>
      </div>

      <section aria-labelledby="daftar-bank-sampah">
        <h2
          id="daftar-bank-sampah"
          className="mb-3 font-headline-md text-headline-md text-on-surface"
        >
          Daftar bank sampah
        </h2>
        {markers.length === 0 ? (
          <KeadaanKosong
            Ikon={Landmark}
            aksen="tempat"
            judul="Belum ada bank sampah terdaftar"
            aksi={
              <Link
                href="/admin/bank-sampah/tambah"
                className="tekan-halus inline-flex min-h-11 items-center rounded-lg bg-primary px-4 font-label-md text-label-md font-semibold text-on-primary focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/50"
              >
                Tambah bank sampah
              </Link>
            }
          >
            Peta terisi begitu ada bank sampah yang punya titik koordinat.
          </KeadaanKosong>
        ) : (
          <DaftarMarker markers={markers} />
        )}
      </section>
    </>
  )
}
