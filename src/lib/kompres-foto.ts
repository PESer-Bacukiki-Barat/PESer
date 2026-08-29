import {
  MAKS_DIMENSI_FOTO_PX,
  MAKS_UKURAN_FOTO_BYTE,
  MUTU_KOMPRESI_FOTO,
  TIPE_FOTO_DIIZINKAN,
} from "@/lib/constants"

/**
 * Kompresi foto bukti di sisi klien — FR-D5, BR-19.
 *
 * Kamera HP menghasilkan berkas 3–8 MB, sementara batasnya 1 MB. Mengunggah
 * apa adanya lalu ditolak server adalah pengalaman terburuk di lapangan:
 * petugas menunggu lama di sinyal lemah untuk sebuah kegagalan yang sudah bisa
 * diketahui sejak awal. Jadi berkasnya diperkecil dulu di perangkat.
 *
 * Perhitungan ukurannya dipisah jadi fungsi murni supaya bisa diuji tanpa
 * browser — canvas dan Image hanya ada di DOM.
 */

export type Dimensi = { lebar: number; tinggi: number }

/**
 * Skala gambar supaya sisi terpanjangnya tidak melebihi batas, dengan rasio
 * aspek tetap.
 *
 * Gambar yang sudah lebih kecil dari batas TIDAK diperbesar — memperbesar
 * hanya menambah byte tanpa menambah informasi.
 */
export function dimensiTerskala(
  asal: Dimensi,
  maksSisi: number = MAKS_DIMENSI_FOTO_PX,
): Dimensi {
  const sisiTerpanjang = Math.max(asal.lebar, asal.tinggi)
  if (sisiTerpanjang <= maksSisi || sisiTerpanjang === 0) return asal

  const rasio = maksSisi / sisiTerpanjang
  return {
    // Dibulatkan ke atas supaya sisi terpendek tidak pernah jadi 0 pada gambar
    // yang sangat panjang (mis. tangkapan layar struk).
    lebar: Math.max(1, Math.round(asal.lebar * rasio)),
    tinggi: Math.max(1, Math.round(asal.tinggi * rasio)),
  }
}

export type HasilPeriksa =
  | { ok: true }
  | { ok: false; pesan: string }

/** Periksa tipe berkas sebelum repot-repot membacanya. */
export function periksaTipe(mimeType: string): HasilPeriksa {
  if (!TIPE_FOTO_DIIZINKAN.includes(mimeType as (typeof TIPE_FOTO_DIIZINKAN)[number])) {
    return {
      ok: false,
      pesan: "Berkas harus berupa gambar JPG, PNG, atau WebP.",
    }
  }
  return { ok: true }
}

/** Periksa ukuran akhir terhadap batas server. */
export function periksaUkuran(byte: number): HasilPeriksa {
  if (byte <= 0) return { ok: false, pesan: "Berkas kosong." }
  if (byte > MAKS_UKURAN_FOTO_BYTE) {
    return {
      ok: false,
      pesan:
        `Foto masih ${Math.round(byte / 1024)} KB setelah dikompresi, ` +
        `batasnya ${Math.round(MAKS_UKURAN_FOTO_BYTE / 1024)} KB. ` +
        "Coba ambil ulang dengan resolusi lebih rendah.",
    }
  }
  return { ok: true }
}

/** Ubah byte jadi teks yang enak dibaca di layar sempit. */
export function formatUkuran(byte: number): string {
  if (byte < 1024) return `${byte} B`
  if (byte < 1024 * 1024) return `${Math.round(byte / 1024)} KB`
  return `${(byte / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Kecilkan gambar lewat canvas dan keluarkan JPEG.
 *
 * Hanya berjalan di browser. Selalu menghasilkan JPEG apa pun tipe masukannya:
 * PNG hasil kamera bisa jauh lebih besar untuk isi yang sama, dan foto bukti
 * tidak butuh transparansi.
 *
 * Kalau kompresi gagal karena alasan apa pun, berkas ASLI dikembalikan — biar
 * server yang memutuskan menerima atau menolak. Menggagalkan unggahan hanya
 * karena canvas bermasalah akan menghukum petugas untuk hal yang bukan salahnya.
 */
export async function kompresFoto(file: File): Promise<File> {
  const tipe = periksaTipe(file.type)
  if (!tipe.ok) throw new Error(tipe.pesan)

  try {
    const bitmap = await createImageBitmap(file)
    const { lebar, tinggi } = dimensiTerskala({
      lebar: bitmap.width,
      tinggi: bitmap.height,
    })

    const canvas = document.createElement("canvas")
    canvas.width = lebar
    canvas.height = tinggi
    const ctx = canvas.getContext("2d")
    if (!ctx) return file

    ctx.drawImage(bitmap, 0, 0, lebar, tinggi)
    bitmap.close()

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", MUTU_KOMPRESI_FOTO),
    )
    if (!blob) return file

    // Kalau hasilnya justru lebih besar (gambar kecil yang sudah teroptimasi),
    // pakai yang asli.
    if (blob.size >= file.size) return file

    return new File([blob], gantiEkstensiJpg(file.name), {
      type: "image/jpeg",
      lastModified: file.lastModified,
    })
  } catch {
    return file
  }
}

function gantiEkstensiJpg(nama: string): string {
  const tanpaEkstensi = nama.replace(/\.[^.]+$/, "")
  return `${tanpaEkstensi || "foto"}.jpg`
}
