"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Camera, Trash2, Upload } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { api, apiError } from "@/lib/api"
import {
  formatUkuran,
  kompresFoto,
  periksaTipe,
  periksaUkuran,
} from "@/lib/kompres-foto"
import { MAKS_UKURAN_FOTO_BYTE, TIPE_FOTO_DIIZINKAN } from "@/lib/constants"

/**
 * Foto bukti serah terima — FR-D5.
 *
 * `capture="environment"` membuat HP membuka kamera belakang langsung, bukan
 * galeri: fotonya memang harus diambil di tempat, bukan dipilih dari berkas
 * lama. Di desktop atribut itu diabaikan dan tetap jadi pemilih berkas biasa.
 *
 * Gambar dikecilkan di perangkat sebelum dikirim. Kamera HP menghasilkan 3–8 MB
 * sementara batasnya 1 MB, dan menunggu unggahan besar di sinyal lapangan untuk
 * kemudian ditolak server adalah kegagalan yang sudah bisa dicegah sejak awal.
 */
export function FotoBukti({
  dispatchId,
  adaFoto,
  bisaUbah,
}: {
  dispatchId: string
  /** Dari `dispatch.fotoBuktiUrl`; server yang menentukan, bukan ditebak klien. */
  adaFoto: boolean
  /** false kalau dispatch sudah final (BR-13) atau pemanggilnya bukan pemilik. */
  bisaUbah: boolean
}) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  const [mengirim, setMengirim] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [konfirmasiHapus, setKonfirmasiHapus] = useState(false)
  // Dipakai untuk memaksa <img> memuat ulang setelah foto diganti; tanpa ini
  // browser menampilkan gambar lama dari cache-nya sendiri.
  const [versi, setVersi] = useState(0)

  // Dua bentuk alamat yang sama: klien axios sudah ber-baseURL "/api", jadi
  // memberinya path lengkap akan menghasilkan /api/api/... — sementara <img>
  // dan <a> justru butuh path lengkapnya.
  const jalurApi = `/dispatch/${dispatchId}/foto`
  const jalurPublik = `/api${jalurApi}`

  async function pilih(file: File | undefined) {
    if (!file) return
    setError(null)

    const tipe = periksaTipe(file.type)
    if (!tipe.ok) {
      setError(tipe.pesan)
      return
    }

    setMengirim(true)
    try {
      const kecil = await kompresFoto(file)
      const ukuran = periksaUkuran(kecil.size)
      if (!ukuran.ok) {
        setError(ukuran.pesan)
        return
      }

      // Body berkas mentah dengan Content-Type sebagai tipenya — bentuk yang
      // diminta route-nya, tanpa ongkos boundary multipart.
      await api.post(jalurApi, kecil, { headers: { "Content-Type": kecil.type } })

      setVersi((v) => v + 1)
      router.refresh()
    } catch (e) {
      setError(apiError(e))
    } finally {
      setMengirim(false)
      // Reset supaya memilih berkas yang SAMA lagi tetap memicu onChange.
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  async function hapus() {
    setMengirim(true)
    setError(null)
    try {
      await api.delete(jalurApi)
      router.refresh()
    } catch (e) {
      setError(apiError(e))
    } finally {
      setMengirim(false)
      setKonfirmasiHapus(false)
    }
  }

  return (
    <section
      aria-labelledby="judul-foto-bukti"
      className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4"
    >
      <h2
        id="judul-foto-bukti"
        className="mb-1 font-label-md text-label-md font-semibold text-on-surface"
      >
        Foto bukti serah terima
      </h2>
      <p className="mb-3 font-label-sm text-label-sm text-on-surface-variant">
        {bisaUbah
          ? `Ambil satu foto saat barang diserahkan. Maksimal ${formatUkuran(MAKS_UKURAN_FOTO_BYTE)}; foto besar dikecilkan otomatis.`
          : adaFoto
            ? "Dispatch sudah final, foto tidak bisa diubah lagi."
            : "Dispatch sudah final tanpa foto bukti."}
      </p>

      {adaFoto ? (
        <a
          href={`${jalurPublik}?v=${versi}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block overflow-hidden rounded-lg border border-outline-variant focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/50"
        >
          {/* next/image tidak dipakai: sumbernya endpoint terproteksi yang
              menyajikan biner, bukan aset statis yang bisa dioptimasi. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${jalurPublik}?v=${versi}`}
            alt="Foto bukti serah terima dispatch"
            className="h-48 w-full bg-surface-container object-cover"
          />
        </a>
      ) : (
        <p className="rounded-lg border border-dashed border-outline-variant px-4 py-6 text-center font-body-md text-body-md text-on-surface-variant">
          Belum ada foto.
        </p>
      )}

      {error && (
        <p
          role="alert"
          className="mt-3 rounded-lg bg-error-container px-3 py-2 font-label-sm text-label-sm text-on-error-container"
        >
          {error}
        </p>
      )}

      {bisaUbah && (
        <div className="mt-3 flex flex-wrap gap-2">
          <input
            ref={inputRef}
            type="file"
            accept={TIPE_FOTO_DIIZINKAN.join(",")}
            capture="environment"
            className="sr-only"
            onChange={(e) => void pilih(e.target.files?.[0])}
            aria-label="Pilih foto bukti"
          />
          <Button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={mengirim}
          >
            {adaFoto ? <Upload className="size-[18px]" /> : <Camera className="size-[18px]" />}
            {mengirim ? "Mengunggah…" : adaFoto ? "Ganti foto" : "Ambil foto"}
          </Button>

          {adaFoto && (
            <Button
              type="button"
              variant="destructive"
              onClick={() => setKonfirmasiHapus(true)}
              disabled={mengirim}
            >
              <Trash2 className="size-[18px]" />
              Hapus
            </Button>
          )}
        </div>
      )}

      <ConfirmDialog
        open={konfirmasiHapus}
        onOpenChange={setKonfirmasiHapus}
        title="Hapus foto bukti?"
        description="Foto akan dihapus permanen. Jejak penghapusannya tetap tercatat di audit log."
        confirmLabel="Hapus"
        loading={mengirim}
        onConfirm={hapus}
      />
    </section>
  )
}
