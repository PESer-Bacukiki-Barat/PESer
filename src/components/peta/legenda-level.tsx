import {
  GAYA_LEVEL,
  URUTAN_LEVEL,
  type MarkerBankSampah,
} from "@/lib/level-stock"

/**
 * Legenda level stock. Server Component — tidak ada interaksi di sini.
 *
 * Hanya menampilkan level yang benar-benar ada di data, supaya legendanya tidak
 * menjelaskan warna yang tidak muncul di peta.
 */
export function LegendaLevel({ markers }: { markers: MarkerBankSampah[] }) {
  const jumlah = new Map<string, number>()
  for (const m of markers) jumlah.set(m.level, (jumlah.get(m.level) ?? 0) + 1)

  const dipakai = URUTAN_LEVEL.filter((l) => jumlah.has(l))
  if (dipakai.length === 0) return null

  const adaNonAktif = markers.some((m) => !m.isActive)

  return (
    <ul
      aria-label="Keterangan warna marker"
      className="flex flex-wrap gap-x-4 gap-y-2"
    >
      {dipakai.map((level) => {
        const gaya = GAYA_LEVEL[level]
        return (
          <li key={level} className="flex items-center gap-2">
            <span
              aria-hidden
              className="size-3.5 shrink-0 rounded-full border-2 border-on-primary shadow-sm"
              style={{ background: gaya.warna }}
            />
            <span className="font-label-sm text-label-sm text-on-surface">
              {gaya.label}
              <span className="text-on-surface-variant"> ({jumlah.get(level)})</span>
            </span>
          </li>
        )
      })}
      {adaNonAktif && (
        <li className="flex items-center gap-2">
          <span
            aria-hidden
            className="size-3.5 shrink-0 rounded-full border-2 border-outline-variant"
          />
          <span className="font-label-sm text-label-sm text-on-surface-variant">
            Non-aktif (cincin kosong)
          </span>
        </li>
      )}
    </ul>
  )
}
