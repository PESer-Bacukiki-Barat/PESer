import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

/**
 * Ukuran teks milik DESIGN.md.
 *
 * Harus didaftarkan karena tailwind-merge tidak bisa menebaknya: `text-body-md`
 * (ukuran) dan `text-on-surface` (warna) sama-sama berawalan `text-`, jadi ia
 * menganggapnya satu kelompok dan MEMBUANG yang lebih dulu.
 *
 * Akibatnya nyata dan senyap — input password di halaman login kehilangan
 * `text-body-md` sehingga ukurannya berbeda dari input email di sebelahnya,
 * tanpa satu pun peringatan dari tsc, eslint, maupun build.
 */
const UKURAN_TEKS = [
  "headline-xl",
  "headline-lg",
  "headline-lg-mobile",
  "headline-md",
  "body-lg",
  "body-md",
  "label-md",
  "label-sm",
]

/** Keluarga font DESIGN.md; bermasalah sama dengan ukuran di atas. */
const KELUARGA_FONT = [
  "headline-xl",
  "headline-lg",
  "headline-lg-mobile",
  "headline-md",
  "body-lg",
  "body-md",
  "label-md",
  "label-sm",
]

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: UKURAN_TEKS }],
      "font-family": [{ font: KELUARGA_FONT }],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
