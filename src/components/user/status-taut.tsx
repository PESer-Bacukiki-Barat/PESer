import type { HasilTaut } from "@/lib/nasabah-tertaut"

/**
 * Penjelasan untuk akun yang belum tertaut ke satu nasabah.
 *
 * Satu komponen untuk seluruh area warga supaya empat halaman tidak menulis
 * empat versi kalimat yang berbeda untuk keadaan yang sama. Tiap keadaan
 * menyebut LANGKAH yang harus diambil, karena warga tidak bisa memperbaikinya
 * sendiri: nomor HP akun hanya boleh diisi admin (lihat schema /api/users).
 */
export function StatusTaut({
  hasil,
  nasabahNonAktif = false,
}: {
  hasil: HasilTaut
  /** Tertaut, tapi nasabahnya dinonaktifkan — hanya relevan di halaman setor. */
  nasabahNonAktif?: boolean
}) {
  const { judul, pesan } = pesanUntuk(hasil, nasabahNonAktif)

  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5">
      <h2 className="mb-1 font-label-md text-label-md font-semibold text-on-surface">
        {judul}
      </h2>
      <p className="font-body-md text-body-md text-on-surface-variant">{pesan}</p>
    </div>
  )
}

function pesanUntuk(
  hasil: HasilTaut,
  nasabahNonAktif: boolean,
): { judul: string; pesan: string } {
  if (nasabahNonAktif) {
    return {
      judul: "Nasabah non-aktif",
      pesan:
        "Data nasabah Anda sedang dinonaktifkan, jadi setoran baru belum bisa " +
        "dicatat. Riwayat lama tetap bisa dibuka. Minta petugas mengaktifkannya " +
        "kembali.",
    }
  }

  switch (hasil.status) {
    case "TANPA_NOHP":
      return {
        judul: "Nomor HP akun belum diisi",
        pesan:
          "Akun ini dikenali sebagai nasabah lewat nomor HP-nya, dan nomor itu " +
          "masih kosong. Minta admin kecamatan mengisi nomor HP akun Anda — " +
          "setelah itu halaman ini terbuka sendiri.",
      }
    case "TIDAK_DITEMUKAN":
      return {
        judul: "Belum terdaftar sebagai nasabah",
        pesan:
          `Nomor HP ${hasil.noHp} belum terdaftar sebagai nasabah di bank sampah ` +
          "Anda. Datang ke pos bank sampah untuk didaftarkan petugas lebih dulu.",
      }
    case "GANDA":
      return {
        judul: "Nomor HP dipakai lebih dari satu nasabah",
        pesan:
          `Ada ${hasil.jumlah} nasabah dengan nomor HP ${hasil.noHp} di bank sampah ` +
          "Anda, jadi sistem tidak bisa memastikan mana yang Anda. Minta petugas " +
          "membetulkan salah satunya lebih dulu.",
      }
    case "TERTAUT":
      // Tidak pernah dirender untuk keadaan ini; cabang ada supaya penambahan
      // status baru di HasilTaut gagal saat compile, bukan diam-diam kosong.
      return { judul: "", pesan: "" }
  }
}
