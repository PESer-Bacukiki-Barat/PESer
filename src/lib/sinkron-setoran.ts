import {
  sudahKedaluwarsa,
  type DraftSetoran,
  type PenyimpananAntrean,
} from "@/lib/antrean-setoran"

/**
 * Sinkronisasi antrean setoran — PRD §4.3 aturan 3–4, FR-F3.
 *
 * "Server menolak key terproses & kembalikan hasil lama (HTTP 200)" berarti
 * mengirim ulang draft yang sudah pernah sampai itu AMAN. Karena itu strategi
 * di sini boleh sederhana: kirim, dan kalau ragu kirim lagi. Yang tidak boleh
 * adalah menghapus draft sebelum server memastikan menerimanya.
 *
 * Fungsi ini murni terhadap dependensinya (penyimpanan + pengirim + waktu),
 * jadi seluruh perilakunya bisa diuji tanpa browser maupun jaringan.
 */

export type HasilKirim =
  /** Server menerima (201) atau mengonfirmasi sudah pernah diterima (200 replay). */
  | { jenis: "sukses"; id?: string; replay?: boolean }
  /**
   * Ditolak karena isinya, bukan karena jaringan — mis. nasabah terhapus atau
   * jenis sampah kehilangan harga. Mengulanginya tidak akan pernah berhasil,
   * jadi draft ditandai GAGAL supaya petugas bisa memperbaiki atau membuangnya.
   */
  | { jenis: "gagal-permanen"; pesan: string }
  /** Jaringan mati atau server error. Draft dipertahankan untuk dicoba lagi. */
  | { jenis: "gagal-jaringan"; pesan: string }

export type Pengirim = (draft: DraftSetoran) => Promise<HasilKirim>

/**
 * Tentukan apakah kegagalan layak dicoba lagi.
 *
 * Ini keputusan paling menentukan di seluruh alur offline: salah menandai
 * kegagalan jaringan sebagai permanen berarti hasil timbangan hilang, dan
 * salah menandai kegagalan validasi sebagai jaringan berarti antrean mencoba
 * selamanya tanpa pernah bisa berhasil.
 *
 * - Tanpa status  -> permintaan tidak pernah sampai, itu jaringan.
 * - 4xx           -> isinya yang ditolak; mengulang tidak akan mengubah hasil.
 * - 5xx           -> server bermasalah sementara, layak dicoba lagi.
 */
export function klasifikasiKegagalan(
  status: number | undefined,
  pesan: string,
): Extract<HasilKirim, { jenis: "gagal-permanen" | "gagal-jaringan" }> {
  if (status !== undefined && status >= 400 && status < 500) {
    return { jenis: "gagal-permanen", pesan }
  }
  return { jenis: "gagal-jaringan", pesan }
}

export type RingkasanSinkron = {
  terkirim: number
  replay: number
  gagalPermanen: number
  kedaluwarsa: number
  /** Masih PENDING_SYNC setelah proses ini — biasanya karena jaringan mati. */
  tertunda: number
}

/**
 * Proses seluruh antrean sekali jalan.
 *
 * Urutannya kronologis (draft terlama dulu) supaya nomor transaksi yang
 * dihasilkan server mengikuti urutan kejadian nyata di lapangan.
 */
export async function sinkronkanAntrean(
  penyimpanan: PenyimpananAntrean,
  kirim: Pengirim,
  sekarang: Date = new Date(),
): Promise<RingkasanSinkron> {
  const hasil: RingkasanSinkron = {
    terkirim: 0,
    replay: 0,
    gagalPermanen: 0,
    kedaluwarsa: 0,
    tertunda: 0,
  }

  const semua = await penyimpanan.semua()

  for (const draft of semua) {
    // Draft yang sudah ditandai GAGAL atau KEDALUWARSA tidak diproses ulang
    // otomatis; keduanya menunggu keputusan petugas.
    if (draft.status !== "PENDING_SYNC") continue

    if (sudahKedaluwarsa(draft, sekarang)) {
      await penyimpanan.simpan({
        ...draft,
        status: "KEDALUWARSA",
        pesanGagal: `Menggantung lebih dari batas retensi, tidak dikirim otomatis`,
      })
      hasil.kedaluwarsa += 1
      continue
    }

    const r = await kirim(draft)

    if (r.jenis === "sukses") {
      // Baru dihapus SETELAH server memastikan menerima.
      await penyimpanan.hapus(draft.idempotencyKey)
      if (r.replay) hasil.replay += 1
      else hasil.terkirim += 1
      continue
    }

    if (r.jenis === "gagal-permanen") {
      await penyimpanan.simpan({
        ...draft,
        status: "GAGAL",
        percobaan: draft.percobaan + 1,
        pesanGagal: r.pesan,
      })
      hasil.gagalPermanen += 1
      continue
    }

    // Kegagalan jaringan: hentikan seluruh proses. Meneruskan ke draft
    // berikutnya hanya menghasilkan deretan kegagalan yang sama, dan setiap
    // percobaan menaikkan penghitung tanpa guna.
    await penyimpanan.simpan({
      ...draft,
      percobaan: draft.percobaan + 1,
      pesanGagal: r.pesan,
    })
    break
  }

  hasil.tertunda = (await penyimpanan.semua()).filter(
    (d) => d.status === "PENDING_SYNC",
  ).length
  return hasil
}

/** Apakah ringkasan ini mengubah data di server? Dipakai untuk memutuskan refresh. */
export function adaPerubahan(r: RingkasanSinkron): boolean {
  return r.terkirim > 0 || r.replay > 0
}
