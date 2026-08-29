import { cn } from "@/lib/utils"

/**
 * Lambang PESer.
 *
 * Sebelumnya layar login memakai ikon `Recycle` bawaan lucide di dalam kotak
 * berwarna — ikon serbaguna yang dipakai ribuan aplikasi lain, jadi ia tidak
 * mengatakan apa pun tentang aplikasi ini.
 *
 * Lambang ini digambar sendiri dari dua gagasan yang memang milik produknya:
 * sebuah DAUN (sampah organik yang kembali jadi sumber daya) yang tumbuh dari
 * sebuah LINGKARAN TERBUKA (siklus daur ulang yang belum tertutup — itulah
 * pekerjaan bank sampah). Goresannya `currentColor` supaya ia mengikuti warna
 * teks induknya, jadi satu berkas ini bekerja di atas latar terang maupun
 * gelap tanpa varian kedua.
 *
 * `strokeLinecap="round"` dan tebal goresan 1,75 dipilih agar sejalan dengan
 * ikon lucide yang dipakai di seluruh aplikasi — lambangnya berbeda, tapi
 * bahasanya sama.
 */
export function MarkaPeser({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden
      className={cn("size-8", className)}
    >
      {/* Siklus: lingkaran yang sengaja tidak tertutup di kanan-bawah. */}
      <path
        d="M26.5 19.2A11 11 0 1 1 22.6 7.2"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      {/* Mata panah yang menutup gerak siklusnya. */}
      <path
        d="M22.9 2.6v4.9h-4.9"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Daun: tulang daun lurus, helai melengkung di kedua sisinya. */}
      <path
        d="M16 22.5V13"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="M16 15.6c0-2.6 1.8-4.7 4.4-4.9-.2 2.7-2 4.7-4.4 4.9Z"
        fill="currentColor"
      />
      <path
        d="M16 18.9c0-2.6-1.8-4.7-4.4-4.9.2 2.7 2 4.7 4.4 4.9Z"
        fill="currentColor"
      />
    </svg>
  )
}

/**
 * Lambang + nama, dipakai di layar masuk dan kepala navigasi.
 *
 * Ukurannya satu, jadi lambang di sidebar admin dan di layar login benar-benar
 * sama — sebelumnya sidebar memakai huruf "P" di dalam kotak sementara login
 * memakai ikon daur ulang, dua identitas berbeda untuk satu produk.
 */
export function LogoPeser({
  className,
  ukuran = "md",
  tampilkanSubjudul = false,
}: {
  className?: string
  ukuran?: "sm" | "md" | "lg"
  tampilkanSubjudul?: boolean
}) {
  const marka = {
    sm: "size-5",
    md: "size-6",
    lg: "size-8",
  }[ukuran]

  const kotak = {
    sm: "size-9 rounded-xl",
    md: "size-11 rounded-2xl",
    lg: "size-14 rounded-2xl",
  }[ukuran]

  const judul = {
    sm: "text-label-md",
    md: "text-headline-md",
    lg: "text-headline-lg",
  }[ukuran]

  return (
    <span className={cn("flex items-center gap-3", className)}>
      <span
        className={cn(
          "flex shrink-0 items-center justify-center bg-primary text-on-primary shadow-sm",
          kotak,
        )}
      >
        <MarkaPeser className={marka} />
      </span>
      <span className="min-w-0">
        <span
          className={cn(
            "block font-headline-md font-bold tracking-tight text-on-surface",
            judul,
          )}
        >
          PESer
        </span>
        {tampilkanSubjudul && (
          <span className="block truncate font-label-sm text-label-sm text-on-surface-variant">
            Bank Sampah Digital
          </span>
        )}
      </span>
    </span>
  )
}
