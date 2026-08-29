import { cn } from "@/lib/utils"

/**
 * Placeholder saat data sedang dimuat.
 *
 * Bukan spinner: skeleton yang MENYERUPAI bentuk akhir membuat halaman terasa
 * sedang terisi, bukan sedang menggantung, dan tidak ada lompatan tata letak
 * ketika isinya datang. Petugas bekerja dari HP dengan sinyal lapangan —
 * di situlah bedanya paling terasa.
 *
 * Denyutnya otomatis berhenti untuk pengguna yang menyalakan
 * `prefers-reduced-motion` (aturan global di globals.css), jadi tidak perlu
 * penanganan khusus di setiap pemakaian.
 */
export function Skeleton({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      // Tidak dibaca pembaca layar: yang mengumumkan keadaan memuat adalah
      // wadah ber-aria-busy di sekitarnya, bukan tiap kotak abu-abu.
      aria-hidden
      className={cn(
        "animate-pulse rounded-md bg-surface-container-high",
        className,
      )}
      {...props}
    />
  )
}

/**
 * Pembungkus daerah yang sedang dimuat.
 *
 * `aria-busy` + teks tersembunyi memberi pembaca layar satu pengumuman yang
 * jelas, alih-alih membiarkannya membaca sekumpulan elemen kosong.
 */
export function AreaMemuat({
  label = "Memuat data",
  className,
  children,
}: {
  label?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div aria-busy="true" aria-live="polite" className={className}>
      <span className="sr-only">{label}…</span>
      {children}
    </div>
  )
}
