import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

import { AKSEN, type NamaAksen } from "@/lib/aksen"
import { cn } from "@/lib/utils"

/**
 * Keadaan kosong — satu bentuk untuk seluruh aplikasi.
 *
 * Sebelumnya ada tiga perlakuan berbeda untuk hal yang sama: beranda warga
 * memakai kartu dengan ikon di tengah, tujuh tempat lain memakai satu paragraf
 * telanjang rata kiri di dalam kotak, dan halaman riwayat tidak punya blok
 * kosong sama sekali — hanya satu kalimat di subjudul. Berkas laporan bahkan
 * sudah menyimpan helper `Kosong` sendiri, jadi polanya memang sudah dikenali;
 * ia hanya belum dibagikan.
 *
 * Ikonnya bukan hiasan. Ia memberi tahu JENIS apa yang kosong sebelum
 * kalimatnya dibaca, dan tonenya diambil dari `AKSEN` yang arti warnanya sudah
 * tetap di seluruh aplikasi — jadi nasabah yang kosong berwarna sama dengan
 * nasabah di mana pun ia muncul. Warna tidak pernah jadi satu-satunya pembeda:
 * judul dan penjelasannya selalu ada.
 *
 * Rata tengah dipilih karena keadaan kosong bukan bacaan panjang: ia satu
 * pesan pendek yang perlu langsung terbaca sebagai "di sini memang belum ada
 * apa-apa", bukan sebagai isi yang gagal dimuat.
 */
export function KeadaanKosong({
  Ikon,
  aksen = "gerak",
  judul,
  children,
  aksi,
  className,
}: {
  Ikon: LucideIcon
  /** Tone kategori yang kosong; lihat src/lib/aksen.ts. */
  aksen?: NamaAksen
  judul: string
  /** Penjelasan singkat: kenapa kosong, dan apa yang membuatnya terisi. */
  children?: ReactNode
  /** Tombol atau tautan langkah berikutnya, kalau ada. */
  aksi?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-xl border border-outline-variant bg-surface-container-lowest px-5 py-8 text-center",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "flex size-11 shrink-0 items-center justify-center rounded-full",
          AKSEN[aksen],
        )}
      >
        <Ikon className="size-5" aria-hidden />
      </span>

      <p className="text-title-sm text-on-surface">{judul}</p>

      {children ? (
        <p className="max-w-[46ch] font-body-md text-body-md text-on-surface-variant">
          {children}
        </p>
      ) : null}

      {aksi ? <div className="mt-1">{aksi}</div> : null}
    </div>
  )
}
