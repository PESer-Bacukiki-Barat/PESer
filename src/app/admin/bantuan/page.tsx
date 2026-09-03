import type { Metadata } from "next"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

export const metadata: Metadata = {
  title: "Bantuan",
}

/**
 * Halaman bantuan. Sebelumnya tertaut dari sidebar tapi 404 — menu yang
 * menjanjikan sesuatu lalu menabrak dinding lebih buruk daripada menu yang
 * jujur. Isinya alur kerja nyata sistem ini beserta aturan yang ditegakkan
 * otomatis, bukan teks pengisi.
 */
const ALUR = [
  {
    judul: "Menyiapkan data induk",
    langkah: [
      "Daftarkan kelurahan lebih dulu — satu kelurahan hanya boleh punya satu bank sampah (BR-01).",
      "Buat bank sampah beserta titik lokasinya.",
      "Isi jenis sampah beserta harga per kg. Jenis berharga 0 tidak akan muncul di form setoran petugas (BR-16).",
      "Buat akun petugas dan tugaskan ke satu bank sampah (BR-02).",
    ],
  },
  {
    judul: "Setoran dari warga",
    langkah: [
      "Dicatat petugas dari aplikasi petugas, bukan dari panel admin.",
      "Sistem mengambil harga dari data induk saat transaksi lalu menyimpannya sebagai snapshot (BR-09) — mengubah harga tidak mengubah setoran lama.",
      "Stock bank sampah naik otomatis, beserta catatan mutasinya.",
      "Uang tunai diserahkan langsung ke warga di luar sistem (BR-04); petugas menandainya di form.",
    ],
  },
  {
    judul: "Menjual ke pembeli",
    langkah: [
      "Admin membuat dispatch. Target tidak boleh melebihi stock tersedia.",
      "Terbitkan dispatch — stock sejumlah target langsung direservasi (BR-12).",
      "Petugas bank sampah menerima atau menolak. Penolakan wajib beralasan dan melepas reservasi.",
      "Petugas mengisi berat aktual saat serah terima. Selisih di atas 5% wajib beralasan dan ditandai untuk direview.",
      "Admin menutup dispatch. Status Selesai bersifat final dan langsung masuk laporan (BR-13).",
    ],
  },
  {
    judul: "Koreksi dan pengawasan",
    langkah: [
      "Petugas bisa mengoreksi stock langsung tanpa persetujuan, tapi wajib mengisi alasan.",
      "Koreksi tidak boleh menurunkan stock di bawah jumlah yang sedang direservasi dispatch.",
      "Semua koreksi tercatat di Riwayat Koreksi Stock, lengkap dengan pelaku dan alasannya.",
      "Setiap perubahan data tercatat di audit log, termasuk keadaan sebelum dan sesudah.",
    ],
  },
]

export default function BantuanPage() {
  return (
    <>
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-2 text-on-surface-variant font-label-sm text-label-sm mb-6"
      >
        <Link className="tekan-halus hover:text-primary" href="/admin">
          Dashboard
        </Link>
        <ChevronRight className="size-4" aria-hidden />
        <span className="text-on-surface font-semibold">Bantuan</span>
      </nav>

      <div className="mb-6">
        <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-2">
          Bantuan
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
          Alur kerja sistem dan aturan yang ditegakkan otomatis.
        </p>
      </div>

      <div className="space-y-4 max-w-3xl">
        {ALUR.map((bagian, i) => (
          <section
            key={bagian.judul}
            className="rounded-xl border border-outline-variant bg-surface-container-lowest overflow-hidden"
          >
            <h2 className="px-5 py-4 border-b border-outline-variant bg-surface-bright text-title-md text-on-surface">
              {i + 1}. {bagian.judul}
            </h2>
            <ol className="divide-y divide-outline-variant">
              {bagian.langkah.map((l) => (
                <li
                  key={l}
                  className="px-5 py-3 font-body-md text-body-md text-on-surface-variant"
                >
                  {l}
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </>
  )
}
