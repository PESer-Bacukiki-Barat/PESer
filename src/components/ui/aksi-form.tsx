"use client"

import { Save } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * Baris tombol di kaki sebuah form.
 *
 * Sebelumnya tiap form menyusun barisnya sendiri dengan
 * `flex items-center justify-end gap-4`. Di desktop itu benar, tapi di layar
 * sempit kedua tombol terhimpit ke tepi kanan — kecil, berdempetan, dan berada
 * di sudut yang paling sulit dijangkau ibu jari.
 *
 * Susunannya sekarang berbeda menurut lebar layar, dan perbedaannya disengaja:
 *
 * - HP: tombol utama MELEBAR PENUH dan berada di ATAS. Aturan Fitts sederhana —
 *   target terbesar untuk aksi yang paling sering dipakai. "Batal" ditaruh di
 *   bawahnya supaya tidak tertekan tanpa sengaja saat ibu jari meraih tombol
 *   utama.
 * - Desktop: kembali sebaris di kanan dengan urutan konvensional (batal lalu
 *   simpan), karena di sana pointer presisi dan mata membaca kiri-ke-kanan
 *   menuju aksi akhir.
 *
 * `flex-col-reverse` yang mewujudkannya: urutan DOM tetap batal-lalu-simpan —
 * itu urutan tab yang wajar dan yang dibacakan pembaca layar — sementara
 * tampilannya dibalik hanya secara visual di layar sempit.
 */
export function AksiForm({
  onBatal,
  labelBatal = "Batal",
  labelSimpan = "Simpan",
  labelMenyimpan,
  menyimpan = false,
  bisaSimpan = true,
  className,
}: {
  onBatal?: () => void
  labelBatal?: string
  labelSimpan?: string
  /** Teks saat proses berjalan; default menurunkan dari labelSimpan. */
  labelMenyimpan?: string
  menyimpan?: boolean
  /** false untuk form yang belum lengkap; tombol tetap terlihat, bukan hilang. */
  bisaSimpan?: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse gap-3 border-t border-outline-variant/50 pt-6",
        "sm:flex-row sm:items-center sm:justify-end sm:gap-4",
        className,
      )}
    >
      {onBatal && (
        <Button
          type="button"
          variant="outline"
          onClick={onBatal}
          // Dinonaktifkan saat menyimpan: membatalkan di tengah permintaan yang
          // sudah terkirim hanya menutup form, bukan membatalkan datanya.
          disabled={menyimpan}
          className="h-11 w-full sm:h-9 sm:w-auto"
        >
          {labelBatal}
        </Button>
      )}

      <Button
        type="submit"
        disabled={menyimpan || !bisaSimpan}
        className="h-11 w-full sm:h-9 sm:w-auto"
      >
        <Save className="size-4" aria-hidden />
        {menyimpan ? (labelMenyimpan ?? `${labelSimpan}…`) : labelSimpan}
      </Button>
    </div>
  )
}
