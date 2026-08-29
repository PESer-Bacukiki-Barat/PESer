import Link from "next/link"
import { MapPin } from "lucide-react"

import {
  GAYA_LEVEL,
  URUTAN_LEVEL,
  type MarkerBankSampah,
} from "@/lib/level-stock"
import { fmtBerat } from "@/lib/format"

/**
 * Pendamping teks untuk peta.
 *
 * Peta ditandai `role="img"`: isinya tidak bisa ditelusuri pembaca layar dan
 * tidak berguna di layar sempit. Daftar ini memuat data yang sama dalam bentuk
 * yang bisa dibaca, diurutkan dari yang paling butuh tindakan — jadi ia bukan
 * pelengkap kosmetik, tapi jalur akses utama kedua ke informasi yang sama.
 */
export function DaftarMarker({ markers }: { markers: MarkerBankSampah[] }) {
  // Urut berdasarkan urgensi level dulu, lalu berat terbanyak di dalam level.
  const urut = [...markers].sort((a, b) => {
    const beda = URUTAN_LEVEL.indexOf(a.level) - URUTAN_LEVEL.indexOf(b.level)
    return beda !== 0 ? beda : b.berat - a.berat
  })

  if (urut.length === 0) return null

  return (
    <ul className="space-y-2">
      {urut.map((m) => {
        const gaya = GAYA_LEVEL[m.level]
        return (
          <li
            key={m.id}
            className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Link
                  href={`/admin/bank-sampah/${m.id}/edit`}
                  className="font-label-md text-label-md text-on-surface hover:text-primary hover:underline"
                >
                  {m.nama}
                </Link>
                <p className="mt-0.5 flex items-center gap-1 font-label-sm text-label-sm text-on-surface-variant">
                  <MapPin className="size-3.5 shrink-0" aria-hidden />
                  <span className="truncate">{m.kelurahan ?? m.alamat}</span>
                </p>
                <p className="mt-1.5 flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 font-label-sm text-label-sm ${gaya.badge}`}
                  >
                    {gaya.label}
                  </span>
                  {!m.isActive && (
                    <span className="rounded-full bg-error-container px-2 py-0.5 font-label-sm text-label-sm text-on-error-container">
                      Non-aktif
                    </span>
                  )}
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    {m.threshold > 0
                      ? `ambang ${fmtBerat(m.threshold)} kg`
                      : "ambang belum diatur"}
                  </span>
                </p>
              </div>
              <p className="shrink-0 font-mono text-body-lg font-semibold text-on-surface">
                {fmtBerat(m.berat)} kg
              </p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
