"use client"

import { useEffect, useSyncExternalStore } from "react"
import { Monitor, Moon, Sun } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Penukar tema terang / gelap / ikut sistem.
 *
 * Palet gelap sudah lengkap di globals.css sejak awal, tapi pemicunya kelas
 * `.dark` yang tidak pernah dipasang siapa pun — jadi separuh sistem warna
 * yang sudah dirancang praktis tidak pernah terlihat.
 *
 * Tiga pilihan, bukan dua: "ikut sistem" adalah bawaan yang benar karena
 * sebagian orang menjadwalkan tema perangkatnya berganti sendiri saat malam,
 * dan memaksa satu pilihan tetap akan melawan kebiasaan itu.
 */

export const KUNCI_TEMA = "peser-tema"

export type Tema = "terang" | "gelap" | "sistem"

const PILIHAN: { nilai: Tema; label: string; Ikon: typeof Sun }[] = [
  { nilai: "terang", label: "Terang", Ikon: Sun },
  { nilai: "gelap", label: "Gelap", Ikon: Moon },
  { nilai: "sistem", label: "Ikut sistem", Ikon: Monitor },
]

/**
 * Skrip yang berjalan SEBELUM halaman digambar.
 *
 * Tanpa ini pengguna bertema gelap melihat kilatan putih di setiap muat
 * halaman: React baru bisa memasang kelasnya setelah hydrate, dan saat itu
 * layar sudah terlanjur dicat terang.
 *
 * Dibungkus try/catch karena localStorage melempar di mode privat sebagian
 * peramban — dan gagal membaca preferensi tema tidak boleh menggagalkan
 * seluruh halaman.
 */
export const SKRIP_TEMA = `
try {
  var t = localStorage.getItem(${JSON.stringify(KUNCI_TEMA)});
  var gelap = t === "gelap" ||
    ((!t || t === "sistem") && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", gelap);
} catch (e) {}
`.trim()

function terapkan(tema: Tema) {
  const gelap =
    tema === "gelap" ||
    (tema === "sistem" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches)
  document.documentElement.classList.toggle("dark", gelap)
}

/**
 * Preferensi tema dibaca lewat useSyncExternalStore, bukan useState + effect.
 *
 * Tiga alasan, sama dengan use-online.ts:
 * 1. localStorage tidak ada saat render di server; getServerSnapshot memberi
 *    nilai yang cocok dengan HTML awal sehingga tidak ada hydration mismatch.
 * 2. Menyetel state di dalam effect memicu render tambahan dan dilarang aturan
 *    react-hooks/set-state-in-effect.
 * 3. Tab lain yang mengubah tema ikut tersinkron lewat event `storage`.
 */
const pendengar = new Set<() => void>()

function beritahu() {
  for (const f of pendengar) f()
}

function berlangganan(onChange: () => void): () => void {
  pendengar.add(onChange)
  window.addEventListener("storage", onChange)
  return () => {
    pendengar.delete(onChange)
    window.removeEventListener("storage", onChange)
  }
}

function bacaTema(): Tema {
  try {
    const t = localStorage.getItem(KUNCI_TEMA)
    return t === "terang" || t === "gelap" ? t : "sistem"
  } catch {
    // Mode privat: preferensi tidak bisa dibaca, bawaannya ikut sistem.
    return "sistem"
  }
}

/** Di server selalu "sistem": itu yang cocok dengan HTML yang dikirim. */
const bacaTemaServer = (): Tema => "sistem"

export function PenukarTema({ className }: { className?: string }) {
  const tema = useSyncExternalStore(berlangganan, bacaTema, bacaTemaServer)

  useEffect(() => {
    if (tema !== "sistem") return
    // Saat mengikuti sistem, tema perangkat bisa berganti sendiri (mis.
    // penjadwalan malam) selagi halaman terbuka.
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const ubah = () => terapkan("sistem")
    mq.addEventListener("change", ubah)
    return () => mq.removeEventListener("change", ubah)
  }, [tema])

  function pilih(nilai: Tema) {
    terapkan(nilai)
    try {
      localStorage.setItem(KUNCI_TEMA, nilai)
    } catch {
      // Tidak bisa disimpan: temanya tetap berlaku untuk sesi ini.
    }
    // localStorage tidak memicu event di tab yang menulisnya sendiri.
    beritahu()
  }

  return (
    <div
      role="radiogroup"
      aria-label="Tema tampilan"
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full border border-outline-variant bg-surface-container-low p-0.5",
        className,
      )}
    >
      {PILIHAN.map(({ nilai, label, Ikon }) => {
        const aktif = tema === nilai
        return (
          <button
            key={nilai}
            type="button"
            role="radio"
            aria-checked={aktif}
            aria-label={label}
            title={label}
            onClick={() => pilih(nilai)}
            className={cn(
              "sentuh-nyaman flex size-7 items-center justify-center rounded-full transition-colors duration-fast",
              "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/50",
              aktif
                ? "bg-primary text-on-primary"
                : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface",
            )}
          >
            <Ikon className="size-4" aria-hidden />
          </button>
        )
      })}
    </div>
  )
}
