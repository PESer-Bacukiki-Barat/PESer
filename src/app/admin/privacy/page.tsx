import type { Metadata } from "next"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

export const metadata: Metadata = {
  title: "Privasi & Data",
}

/**
 * Halaman privasi.
 *
 * Isinya menjelaskan perlakuan data yang BENAR-BENAR diterapkan sistem ini —
 * soft delete, audit log, snapshot harga, penyensoran kredensial, dan scope
 * dari sesi — bukan template hukum generik yang tidak mencerminkan kode.
 * Kalau salah satu poin di sini berubah di kode, poinnya harus ikut diperbarui.
 */
const BAGIAN = [
  {
    judul: "Data yang disimpan",
    isi: [
      "Warga (nasabah): nama, nomor HP opsional, alamat, RT/RW, dan bank sampah tempat menyetor. Warga bukan pengguna sistem — mereka tidak punya akun maupun kata sandi (BR-03).",
      "Petugas dan admin: nama, email sebagai identitas login, peran, dan penugasan bank sampah.",
      "Transaksi: setoran beserta rincian jenis, berat, kondisi, dan harga saat transaksi; dispatch beserta berat target dan berat aktual.",
    ],
  },
  {
    judul: "Kata sandi",
    isi: [
      "Kata sandi disimpan sebagai hash bcrypt, tidak pernah dalam bentuk asli.",
      "Admin tidak bisa membaca kata sandi siapa pun — hanya bisa menetapkan yang baru.",
      "Setiap pengguna bisa mengganti kata sandinya sendiri, dan wajib memasukkan kata sandi lama sebagai verifikasi.",
      "Hash kata sandi disensor sebelum masuk audit log.",
    ],
  },
  {
    judul: "Data tidak dihapus permanen",
    isi: [
      "Penghapusan data induk bersifat soft delete: baris ditandai terhapus dan tidak lagi muncul, tapi tetap ada agar transaksi lama tidak kehilangan rujukan (BR-17).",
      "Transaksi setoran tidak bisa dihapus. Koreksi dilakukan lewat mutasi, bukan penghapusan.",
      "Harga di-snapshot saat transaksi, sehingga mengubah harga hari ini tidak mengubah nilai transaksi masa lalu (BR-09).",
    ],
  },
  {
    judul: "Jejak perubahan",
    isi: [
      "Setiap penulisan data mencatat audit log dalam transaksi yang sama: siapa, kapan, keadaan sebelum, dan keadaan sesudah.",
      "Perubahan stock selalu disertai catatan mutasi, sehingga selisih stock selalu bisa dilacak sumbernya.",
      "Koreksi stock wajib beralasan dan tercatat atas nama pelakunya.",
    ],
  },
  {
    judul: "Batas akses",
    isi: [
      "Petugas hanya bisa melihat dan mengubah data bank sampah tempat ia ditugaskan. Batas ini diambil dari sesi, bukan dari isi permintaan, sehingga tidak bisa dimanipulasi dari sisi klien.",
      "Data induk dan laporan se-kecamatan hanya untuk admin.",
      "Pembayaran tunai ke warga terjadi di luar sistem; sistem ini tidak menyimpan data rekening maupun memproses uang (BR-04, BR-15).",
    ],
  },
]

export default function PrivacyPage() {
  return (
    <>
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-2 text-on-surface-variant font-label-sm text-label-sm mb-6"
      >
        <Link className="hover:text-primary transition-colors" href="/admin">
          Dashboard
        </Link>
        <ChevronRight className="size-4" />
        <span className="text-on-surface font-semibold">Privasi &amp; Data</span>
      </nav>

      <div className="mb-6">
        <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-2">
          Privasi &amp; Data
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
          Bagaimana sistem ini memperlakukan data warga, petugas, dan transaksi.
        </p>
      </div>

      <div className="space-y-4 max-w-3xl">
        {BAGIAN.map((b) => (
          <section
            key={b.judul}
            className="rounded-xl border border-outline-variant bg-surface-container-lowest overflow-hidden"
          >
            <h2 className="px-5 py-4 border-b border-outline-variant bg-surface-bright text-title-md text-on-surface">
              {b.judul}
            </h2>
            <ul className="divide-y divide-outline-variant">
              {b.isi.map((t) => (
                <li
                  key={t}
                  className="px-5 py-3 font-body-md text-body-md text-on-surface-variant"
                >
                  {t}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  )
}
