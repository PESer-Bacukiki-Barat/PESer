import { prisma } from "@/lib/prisma"
import { normalkanNoHp } from "@/lib/no-hp"

/**
 * Penautan akun (User) ke Nasabah untuk area warga.
 *
 * PRD §2.4 hanya mengenal ADMIN dan PETUGAS — tidak ada actor "warga", jadi
 * area /(user) menumpang akun biasa dan mengenali pemiliknya lewat `noHp` yang
 * sama di bank sampah tempat akun itu ditugaskan.
 *
 * Satu modul untuk seluruh area, karena aturannya identik di beranda,
 * aktivitas, setor, dan bukti setor — dan karena satu-satunya cara aman
 * menautkan identitas adalah menolak menebak. Sebelum ini tiap halaman
 * menyalin `...(user.noHp ? { noHp: user.noHp } : {})`, yang justru MENGHAPUS
 * filter ketika noHp kosong: findFirst lalu mengembalikan nasabah pertama di
 * bank sampah itu, dan akun tanpa nomor HP tampil sebagai orang lain —
 * membaca riwayatnya, bahkan menyetor atas namanya.
 */

export type NasabahTertaut = {
  id: string
  nama: string
  kodeNasabah: string
  isActive: boolean
}

export type HasilTaut =
  /** Tepat satu nasabah cocok — satu-satunya keadaan yang boleh dipakai. */
  | { status: "TERTAUT"; nasabah: NasabahTertaut }
  /** Akun belum punya nomor HP, jadi tidak ada yang bisa dicocokkan. */
  | { status: "TANPA_NOHP" }
  /** Nomor HP terisi tapi belum ada nasabahnya di bank sampah ini. */
  | { status: "TIDAK_DITEMUKAN"; noHp: string }
  /**
   * Lebih dari satu nasabah memakai nomor yang sama. `Nasabah.noHp` tidak
   * unique di skema, jadi keadaan ini mungkin terjadi — dan identitas yang
   * ambigu harus ditolak, bukan diambil salah satu.
   */
  | { status: "GANDA"; noHp: string; jumlah: number }

/**
 * Cari nasabah yang tertaut ke sebuah akun.
 *
 * Pencocokan dilakukan di aplikasi, bukan lewat `where noHp`, karena nomor
 * harus dinormalkan lebih dulu di KEDUA sisi — kolomnya menyimpan apa pun yang
 * diketik. Kandidatnya dibatasi satu bank sampah, jadi jumlah barisnya sebesar
 * daftar nasabah satu pos, bukan sekecamatan.
 *
 * `isActive` tidak dijadikan filter: identitas tetap identitas meski nasabahnya
 * dinonaktifkan, supaya riwayatnya tidak ikut hilang. Statusnya dikembalikan
 * agar halaman setor bisa menolak sendiri, sejalan dengan form petugas yang
 * hanya menawarkan nasabah aktif.
 */
export async function nasabahTertaut({
  noHp,
  bankSampahId,
}: {
  noHp: string | null
  bankSampahId: string
}): Promise<HasilTaut> {
  const target = normalkanNoHp(noHp)
  if (!target) return { status: "TANPA_NOHP" }

  const kandidat = await prisma.nasabah.findMany({
    where: { bankSampahId, deletedAt: null, noHp: { not: null } },
    orderBy: { kodeNasabah: "asc" },
    select: { id: true, nama: true, kodeNasabah: true, isActive: true, noHp: true },
  })

  const cocok = kandidat.filter((n) => normalkanNoHp(n.noHp) === target)
  if (cocok.length === 0) return { status: "TIDAK_DITEMUKAN", noHp: target }
  if (cocok.length > 1) {
    return { status: "GANDA", noHp: target, jumlah: cocok.length }
  }

  const { id, nama, kodeNasabah, isActive } = cocok[0]
  return { status: "TERTAUT", nasabah: { id, nama, kodeNasabah, isActive } }
}
