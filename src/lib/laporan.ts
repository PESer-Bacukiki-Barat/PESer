import { prisma } from "@/lib/prisma"
import { buildCsv, type CsvColumn } from "@/lib/export"

/**
 * Laporan Modul E — FR-E3 (volume masuk per periode) dan FR-E4 (penjualan).
 *
 * Query DAN agregasinya ditaruh di satu modul yang dipakai bersama endpoint
 * API dan halaman /admin/laporan. Kalau halaman menghitung sendiri, angka di
 * layar dan angka di CSV bisa berbeda tanpa ada yang menyadarinya.
 *
 * G6 [WAJIB] "tanpa selisih retroaktif" dipenuhi secara struktural, bukan
 * dengan disiplin: penjualan hanya menghitung dispatch berstatus SELESAI, dan
 * BR-13 menetapkan SELESAI final. Jadi baris yang sudah masuk laporan tidak
 * bisa berubah lagi.
 */

export type Periode = { dari?: Date; sampai?: Date }

/** Rentang tanggal Prisma dari periode; undefined kalau tidak dibatasi. */
function rentang(periode: Periode) {
  const { dari, sampai } = periode
  if (!dari && !sampai) return undefined
  return { ...(dari && { gte: dari }), ...(sampai && { lte: sampai }) }
}

const angka = (n: number) => Math.round(n * 100) / 100

/** Jumlahkan ke dalam Map, dipakai untuk semua rincian per-kategori. */
function tambah<T>(
  peta: Map<string, T>,
  kunci: string,
  awal: () => T,
  ubah: (nilai: T) => void,
) {
  const nilai = peta.get(kunci) ?? awal()
  ubah(nilai)
  peta.set(kunci, nilai)
}

// ---------------------------------------------------------------- penjualan

export type BarisPenjualan = {
  kodeDispatch: string
  tanggal: string
  bankSampah: string
  pembeli: string
  beratAktual: number
  totalNilai: number
  selisihSignifikan: boolean
}

export type RincianPenjualan = { nama: string; berat: number; nilai: number; transaksi: number }

export type LaporanPenjualan = {
  periode: { dari: string | null; sampai: string | null }
  ringkasan: { transaksi: number; berat: number; nilai: number }
  perBankSampah: RincianPenjualan[]
  perPembeli: RincianPenjualan[]
  perJenisSampah: RincianPenjualan[]
  baris: BarisPenjualan[]
}

/**
 * FR-E4. Tanggal acuannya `tanggalJemput` — tanggal bisnis penjualannya,
 * dan satu-satunya tanggal pada Dispatch yang tidak bergerak saat status
 * berubah (`updatedAt` bergerak, jadi tidak bisa dipakai untuk periode).
 */
export async function laporanPenjualan(periode: Periode): Promise<LaporanPenjualan> {
  const tanggalJemput = rentang(periode)

  const rows = await prisma.dispatch.findMany({
    where: {
      deletedAt: null,
      status: "SELESAI",
      ...(tanggalJemput && { tanggalJemput }),
    },
    orderBy: { tanggalJemput: "asc" },
    select: {
      kodeDispatch: true,
      tanggalJemput: true,
      totalNilai: true,
      selisihSignifikan: true,
      bankSampah: { select: { nama: true } },
      pembeli: { select: { nama: true } },
      items: {
        select: {
          beratAktual: true,
          subtotal: true,
          jenisSampah: { select: { nama: true } },
        },
      },
    },
  })

  const perBankSampah = new Map<string, RincianPenjualan>()
  const perPembeli = new Map<string, RincianPenjualan>()
  const perJenisSampah = new Map<string, RincianPenjualan>()

  const baris: BarisPenjualan[] = rows.map((d) => {
    // Berat yang dilaporkan adalah berat AKTUAL serah terima, bukan target —
    // itu yang benar-benar keluar dari gudang (BR-11).
    const berat = d.items.reduce((a, i) => a + Number(i.beratAktual ?? 0), 0)
    const nilai = Number(d.totalNilai ?? 0)

    const isi = (r: RincianPenjualan) => {
      r.berat = angka(r.berat + berat)
      r.nilai = angka(r.nilai + nilai)
      r.transaksi += 1
    }
    const kosong = (nama: string) => () => ({ nama, berat: 0, nilai: 0, transaksi: 0 })

    tambah(perBankSampah, d.bankSampah.nama, kosong(d.bankSampah.nama), isi)
    tambah(perPembeli, d.pembeli.nama, kosong(d.pembeli.nama), isi)

    for (const i of d.items) {
      const nama = i.jenisSampah.nama
      tambah(perJenisSampah, nama, kosong(nama), (r) => {
        r.berat = angka(r.berat + Number(i.beratAktual ?? 0))
        r.nilai = angka(r.nilai + Number(i.subtotal ?? 0))
        r.transaksi += 1
      })
    }

    return {
      kodeDispatch: d.kodeDispatch,
      tanggal: d.tanggalJemput.toISOString(),
      bankSampah: d.bankSampah.nama,
      pembeli: d.pembeli.nama,
      beratAktual: angka(berat),
      totalNilai: nilai,
      selisihSignifikan: d.selisihSignifikan,
    }
  })

  const urut = (m: Map<string, RincianPenjualan>) =>
    [...m.values()].sort((a, b) => b.nilai - a.nilai)

  return {
    periode: {
      dari: periode.dari?.toISOString() ?? null,
      sampai: periode.sampai?.toISOString() ?? null,
    },
    ringkasan: {
      transaksi: baris.length,
      berat: angka(baris.reduce((a, b) => a + b.beratAktual, 0)),
      nilai: angka(baris.reduce((a, b) => a + b.totalNilai, 0)),
    },
    perBankSampah: urut(perBankSampah),
    perPembeli: urut(perPembeli),
    perJenisSampah: urut(perJenisSampah),
    baris,
  }
}

const KOLOM_PENJUALAN: CsvColumn[] = [
  { key: "kodeDispatch", label: "Kode Dispatch" },
  { key: "tanggal", label: "Tanggal Jemput" },
  { key: "bankSampah", label: "Bank Sampah" },
  { key: "pembeli", label: "Pembeli" },
  { key: "beratAktual", label: "Berat Aktual (kg)" },
  { key: "totalNilai", label: "Nilai Penjualan (Rp)" },
  { key: "selisihSignifikan", label: "Selisih Signifikan" },
]

export function penjualanKeCsv(l: LaporanPenjualan): string {
  return buildCsv(
    l.baris.map((b) => ({
      ...b,
      tanggal: b.tanggal.slice(0, 10),
      selisihSignifikan: b.selisihSignifikan ? "Ya" : "Tidak",
    })),
    KOLOM_PENJUALAN,
  )
}

// ------------------------------------------------------------------- volume

export type BarisVolume = {
  kodeTransaksi: string
  tanggal: string
  bankSampah: string
  nasabah: string
  petugas: string
  totalBerat: number
  totalNilai: number
  jumlahItem: number
  cashDibayar: boolean
}

export type RincianVolume = { nama: string; berat: number; nilai: number; setoran: number }

export type LaporanVolume = {
  periode: { dari: string | null; sampai: string | null }
  ringkasan: {
    setoran: number
    berat: number
    nilai: number
    nasabahAktif: number
    tunaiBelum: number
  }
  perBankSampah: RincianVolume[]
  perJenisSampah: RincianVolume[]
  baris: BarisVolume[]
}

/** FR-E3 — volume sampah masuk per periode, dari Setoran. */
export async function laporanVolume(periode: Periode): Promise<LaporanVolume> {
  const tanggal = rentang(periode)

  const rows = await prisma.setoran.findMany({
    where: { ...(tanggal && { tanggal }) },
    orderBy: { tanggal: "asc" },
    select: {
      kodeTransaksi: true,
      tanggal: true,
      totalBerat: true,
      totalNilai: true,
      cashDibayar: true,
      nasabahId: true,
      bankSampah: { select: { nama: true } },
      nasabah: { select: { nama: true } },
      petugas: { select: { nama: true } },
      items: {
        select: { berat: true, subtotal: true, jenisSampah: { select: { nama: true } } },
      },
    },
  })

  const perBankSampah = new Map<string, RincianVolume>()
  const perJenisSampah = new Map<string, RincianVolume>()
  const nasabahUnik = new Set<string>()

  const baris: BarisVolume[] = rows.map((s) => {
    const berat = Number(s.totalBerat)
    const nilai = Number(s.totalNilai)
    nasabahUnik.add(s.nasabahId)

    const kosong = (nama: string) => () => ({ nama, berat: 0, nilai: 0, setoran: 0 })
    tambah(perBankSampah, s.bankSampah.nama, kosong(s.bankSampah.nama), (r) => {
      r.berat = angka(r.berat + berat)
      r.nilai = angka(r.nilai + nilai)
      r.setoran += 1
    })

    for (const i of s.items) {
      const nama = i.jenisSampah.nama
      tambah(perJenisSampah, nama, kosong(nama), (r) => {
        r.berat = angka(r.berat + Number(i.berat))
        r.nilai = angka(r.nilai + Number(i.subtotal))
        r.setoran += 1
      })
    }

    return {
      kodeTransaksi: s.kodeTransaksi,
      tanggal: s.tanggal.toISOString(),
      bankSampah: s.bankSampah.nama,
      nasabah: s.nasabah.nama,
      petugas: s.petugas.nama,
      totalBerat: berat,
      totalNilai: nilai,
      jumlahItem: s.items.length,
      cashDibayar: s.cashDibayar,
    }
  })

  const urut = <T extends { berat: number }>(m: Map<string, T>) =>
    [...m.values()].sort((a, b) => b.berat - a.berat)

  return {
    periode: {
      dari: periode.dari?.toISOString() ?? null,
      sampai: periode.sampai?.toISOString() ?? null,
    },
    ringkasan: {
      setoran: baris.length,
      berat: angka(baris.reduce((a, b) => a + b.totalBerat, 0)),
      nilai: angka(baris.reduce((a, b) => a + b.totalNilai, 0)),
      nasabahAktif: nasabahUnik.size,
      tunaiBelum: baris.filter((b) => !b.cashDibayar).length,
    },
    perBankSampah: urut(perBankSampah),
    perJenisSampah: urut(perJenisSampah),
    baris,
  }
}

const KOLOM_VOLUME: CsvColumn[] = [
  { key: "kodeTransaksi", label: "Kode Transaksi" },
  { key: "tanggal", label: "Tanggal" },
  { key: "bankSampah", label: "Bank Sampah" },
  { key: "nasabah", label: "Nasabah" },
  { key: "petugas", label: "Petugas" },
  { key: "totalBerat", label: "Total Berat (kg)" },
  { key: "totalNilai", label: "Dibayar ke Warga (Rp)" },
  { key: "jumlahItem", label: "Jumlah Item" },
  { key: "cashDibayar", label: "Tunai Diserahkan" },
]

export function volumeKeCsv(l: LaporanVolume): string {
  return buildCsv(
    l.baris.map((b) => ({
      ...b,
      tanggal: b.tanggal.slice(0, 10),
      cashDibayar: b.cashDibayar ? "Ya" : "Belum",
    })),
    KOLOM_VOLUME,
  )
}
