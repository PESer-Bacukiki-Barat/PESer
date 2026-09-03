"use client"

import { useMemo } from "react"
import { Toast } from "@base-ui/react/toast"
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Pemberitahuan singkat setelah sebuah aksi selesai.
 *
 * Sebelum ini tidak ada umpan balik sama sekali: menyimpan berhasil hanya
 * membuat layar berpindah, dan pengguna tidak pernah diberi tahu apakah
 * datanya benar-benar tersimpan. Yang paling merugikan justru kasus gagal di
 * latar belakang — ia lewat tanpa jejak.
 *
 * Dibangun di atas Toast milik Base UI yang sudah terpasang, bukan menambah
 * paket baru — PRD §8.1 menyuruh memakai yang sudah ada lebih dulu.
 *
 * Letaknya di ATAS layar, bukan bawah: area bawah sudah ditempati bottom nav
 * petugas dan bilah aksi form setoran, dan menutupi tombol simpan dengan
 * pemberitahuan tentang tombol simpan itu sendiri adalah gangguan, bukan
 * bantuan.
 */

type Nada = "sukses" | "gagal" | "info"

const GAYA: Record<Nada, { kelas: string; Ikon: typeof CheckCircle2 }> = {
  sukses: {
    kelas: "border-primary/30 bg-primary-container text-on-primary-container",
    Ikon: CheckCircle2,
  },
  gagal: {
    kelas: "border-error/30 bg-error-container text-on-error-container",
    Ikon: AlertTriangle,
  },
  info: {
    kelas: "border-outline-variant bg-surface-container-high text-on-surface",
    Ikon: Info,
  },
}

/** Bungkus aplikasi; dipasang sekali di root layout. */
export function PenyediaToast({ children }: { children: React.ReactNode }) {
  return (
    <Toast.Provider>
      {children}
      <Toast.Portal>
        <Toast.Viewport
          className={cn(
            "fixed top-4 right-4 left-4 z-[100] flex flex-col gap-2",
            "sm:left-auto sm:w-96",
          )}
        >
          <DaftarToast />
        </Toast.Viewport>
      </Toast.Portal>
    </Toast.Provider>
  )
}

function DaftarToast() {
  const { toasts } = Toast.useToastManager()

  return toasts.map((t) => {
    const nada = (t.data as { nada?: Nada } | undefined)?.nada ?? "info"
    const { kelas, Ikon } = GAYA[nada]

    return (
      <Toast.Root
        key={t.id}
        toast={t}
        className={cn(
          "flex items-start gap-3 rounded-xl border p-3.5 shadow-lg",
          // Muncul dan pergi dengan gerak yang sama seperti sisa aplikasi.
          // Keduanya otomatis mati untuk prefers-reduced-motion.
          "transition-[opacity,transform] duration-normal",
          "data-[starting-style]:translate-y-[-8px] data-[starting-style]:opacity-0",
          "data-[ending-style]:translate-y-[-8px] data-[ending-style]:opacity-0",
          kelas,
        )}
      >
        <Ikon className="mt-px size-4 shrink-0" aria-hidden />
        <div className="min-w-0 flex-1">
          <Toast.Title className="font-label-md text-label-md font-semibold" />
          <Toast.Description className="mt-0.5 font-body-md text-body-md opacity-90" />
        </div>
        <Toast.Close
          aria-label="Tutup pemberitahuan"
          className="sentuh-nyaman -m-1 shrink-0 rounded-md p-1 opacity-70 transition-opacity duration-fast hover:opacity-100 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/50"
        >
          <X className="size-4" aria-hidden />
        </Toast.Close>
      </Toast.Root>
    )
  })
}

/**
 * Hook pemanggil.
 *
 * Sengaja membungkus useToastManager alih-alih memakainya langsung, supaya
 * seluruh aplikasi memakai tiga nada yang sama dan durasinya seragam —
 * kegagalan bertahan lebih lama karena pengguna perlu waktu membacanya, dan
 * sering perlu menyalin pesannya.
 */
export function useToast() {
  const manajer = Toast.useToastManager()

  /**
   * Dimemo supaya rujukannya stabil antar render.
   *
   * Sebelumnya hook ini mengembalikan objek literal baru setiap render, jadi
   * komponen yang menaruh `toast` di dependency array useCallback/useEffect
   * — sesuatu yang wajar dan bahkan diminta aturan react-hooks/exhaustive-deps
   * — mendapat fungsi baru tiap render, dan effect-nya berjalan terus tanpa
   * henti. Di users-table itu berarti permintaan GET /users berulang selamanya.
   */
  return useMemo(
    () => ({
      sukses: (judul: string, pesan?: string) =>
        manajer.add({
          title: judul,
          description: pesan,
          data: { nada: "sukses" satisfies Nada },
          timeout: 4000,
        }),
      gagal: (judul: string, pesan?: string) =>
        manajer.add({
          title: judul,
          description: pesan,
          data: { nada: "gagal" satisfies Nada },
          timeout: 8000,
        }),
      info: (judul: string, pesan?: string) =>
        manajer.add({
          title: judul,
          description: pesan,
          data: { nada: "info" satisfies Nada },
          timeout: 4000,
        }),
    }),
    [manajer],
  )
}
