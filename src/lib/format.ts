/**
 * Pemformat angka dan tanggal — satu sumber untuk seluruh aplikasi.
 *
 * Sebelumnya ada 34 definisi lokal tersebar di 19 berkas, dan sudah mulai
 * menyimpang: sebelas tempat membulatkan rupiah ke satuan, empat tempat lain
 * membiarkan dua desimal. Artinya nilai yang SAMA bisa tampil "Rp 15.001" di
 * satu layar dan "Rp 15.000,5" di layar berikutnya — persis hal yang membuat
 * sebuah aplikasi terasa dirakit, bukan dirancang.
 *
 * Murni, tanpa dependensi, jadi aman dipakai Server Component maupun Client
 * Component dan bisa diuji tanpa DOM.
 *
 * Namanya sengaja tetap berawalan `fmt` seperti definisi lokal yang lama:
 * tidak satu pun pemanggilan perlu diubah, dan `berat` tanpa awalan akan
 * bentrok dengan variabel domain bernama sama yang dipakai di banyak berkas.
 */

/**
 * Rupiah, selalu bulat.
 *
 * Rupiah tidak punya satuan pecahan yang dipakai sehari-hari, dan PRD §4.1
 * bahkan membulatkan pembayaran tunai ke Rp 500 terdekat (PEMBULATAN_TUNAI).
 * `maximumFractionDigits` ditulis eksplisit — kalau dibiarkan, nilainya
 * bergantung versi ICU di mesin yang menjalankan, sehingga keluarannya bisa
 * berbeda antara laptop pengembang dan server produksi.
 */
export function fmtRupiah(nilai: number | null | undefined): string {
  if (nilai == null || Number.isNaN(nilai)) return "—"
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(nilai)
}

/**
 * Berat dalam kilogram, maksimal 2 desimal (BR-08, Decimal(10,2)).
 *
 * Tanpa satuan: pemanggil yang menentukan apakah menulis "kg" di sebelahnya,
 * karena sebagian tempat menaruhnya di elemen terpisah dengan gaya berbeda.
 */
export function fmtBerat(nilai: number | null | undefined): string {
  if (nilai == null || Number.isNaN(nilai)) return "—"
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(nilai)
}

/** Berat lengkap dengan satuannya — bentuk yang paling sering dipakai. */
export function fmtBeratKg(nilai: number | null | undefined): string {
  const n = fmtBerat(nilai)
  return n === "—" ? n : `${n} kg`
}

/** Bilangan biasa (jumlah transaksi, jumlah nasabah). */
export function fmtAngka(nilai: number | null | undefined): string {
  if (nilai == null || Number.isNaN(nilai)) return "—"
  return new Intl.NumberFormat("id-ID").format(nilai)
}

type MasukanTanggal = Date | string | number | null | undefined

function keTanggal(nilai: MasukanTanggal): Date | null {
  if (nilai == null) return null
  const d = nilai instanceof Date ? nilai : new Date(nilai)
  return Number.isNaN(d.getTime()) ? null : d
}

/** "29 Agu 2026" — bentuk ringkas untuk tabel dan kartu. */
export function fmtTanggal(nilai: MasukanTanggal): string {
  const d = keTanggal(nilai)
  if (!d) return "—"
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

/** "29 Agu 2026, 14.30" — dipakai saat jam transaksi ikut penting. */
export function fmtTanggalWaktu(nilai: MasukanTanggal): string {
  const d = keTanggal(nilai)
  if (!d) return "—"
  return `${fmtTanggal(d)}, ${d.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  })}`
}

/** "29 Agustus 2026" — bentuk panjang untuk judul laporan dan bukti setor. */
export function fmtTanggalPanjang(nilai: MasukanTanggal): string {
  const d = keTanggal(nilai)
  if (!d) return "—"
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}
