/**
 * Laporan Modul E — FR-E3 (volume) & FR-E4 (penjualan).
 *
 * Yang dijaga di sini: jaminan G6 [WAJIB] "tanpa selisih retroaktif" benar-benar
 * berasal dari filter status SELESAI, laporan memakai berat AKTUAL (bukan
 * target), dan agregasi per kategori menjumlahkan hal yang benar. Angka salah
 * di laporan tidak memunculkan error apa pun — hanya keputusan yang keliru.
 */
import { Prisma } from "@/generated/prisma/client"
import { prisma } from "@/lib/prisma"
import {
  laporanPenjualan,
  laporanVolume,
  penjualanKeCsv,
  volumeKeCsv,
} from "@/lib/laporan"

jest.mock("@/lib/prisma", () => ({
  prisma: {
    dispatch: { findMany: jest.fn() },
    setoran: { findMany: jest.fn() },
  },
}))

const m = prisma as unknown as {
  dispatch: { findMany: jest.Mock }
  setoran: { findMany: jest.Mock }
}

const D = (n: number) => new Prisma.Decimal(n)

const dispatchRow = (o: {
  kode: string
  bank: string
  pembeli: string
  nilai: number
  items: { jenis: string; aktual: number; subtotal: number }[]
  selisih?: boolean
  tanggal?: string
}) => ({
  kodeDispatch: o.kode,
  tanggalJemput: new Date(o.tanggal ?? "2026-08-10T00:00:00.000Z"),
  totalNilai: D(o.nilai),
  selisihSignifikan: o.selisih ?? false,
  bankSampah: { nama: o.bank },
  pembeli: { nama: o.pembeli },
  items: o.items.map((i) => ({
    beratAktual: D(i.aktual),
    subtotal: D(i.subtotal),
    jenisSampah: { nama: i.jenis },
  })),
})

const setoranRow = (o: {
  kode: string
  bank: string
  nasabahId: string
  nasabah: string
  berat: number
  nilai: number
  cash?: boolean
  items: { jenis: string; berat: number; subtotal: number }[]
}) => ({
  kodeTransaksi: o.kode,
  tanggal: new Date("2026-08-12T00:00:00.000Z"),
  totalBerat: D(o.berat),
  totalNilai: D(o.nilai),
  cashDibayar: o.cash ?? true,
  nasabahId: o.nasabahId,
  bankSampah: { nama: o.bank },
  nasabah: { nama: o.nasabah },
  petugas: { nama: "Andi" },
  items: o.items.map((i) => ({
    berat: D(i.berat),
    subtotal: D(i.subtotal),
    jenisSampah: { nama: i.jenis },
  })),
})

beforeEach(() => {
  m.dispatch.findMany.mockResolvedValue([])
  m.setoran.findMany.mockResolvedValue([])
})

describe("laporanPenjualan — jaminan tanpa selisih retroaktif (G6)", () => {
  it("HANYA menghitung dispatch berstatus SELESAI", async () => {
    await laporanPenjualan({})
    expect(m.dispatch.findMany.mock.calls[0][0].where).toEqual(
      expect.objectContaining({ status: "SELESAI", deletedAt: null }),
    )
  })

  it("periode disaring pada tanggalJemput, bukan updatedAt", async () => {
    // updatedAt bergerak saat status berubah, jadi tidak bisa jadi acuan periode.
    const dari = new Date("2026-08-01")
    const sampai = new Date("2026-08-31")
    await laporanPenjualan({ dari, sampai })
    const where = m.dispatch.findMany.mock.calls[0][0].where
    expect(where.tanggalJemput).toEqual({ gte: dari, lte: sampai })
    expect(where).not.toHaveProperty("updatedAt")
  })

  it("tanpa periode, tidak ada filter tanggal", async () => {
    await laporanPenjualan({})
    expect(m.dispatch.findMany.mock.calls[0][0].where).not.toHaveProperty("tanggalJemput")
  })
})

describe("laporanPenjualan — agregasi", () => {
  beforeEach(() => {
    m.dispatch.findMany.mockResolvedValue([
      dispatchRow({
        kode: "DSP-1",
        bank: "BS Mawar",
        pembeli: "PT Daur",
        nilai: 90000,
        items: [{ jenis: "PET", aktual: 18, subtotal: 90000 }],
        selisih: true,
      }),
      dispatchRow({
        kode: "DSP-2",
        bank: "BS Mawar",
        pembeli: "UD Plastik",
        nilai: 50000,
        items: [
          { jenis: "PET", aktual: 5, subtotal: 25000 },
          { jenis: "Kardus", aktual: 10, subtotal: 25000 },
        ],
      }),
    ])
  })

  it("ringkasan menjumlahkan berat aktual dan nilai", async () => {
    const l = await laporanPenjualan({})
    expect(l.ringkasan).toEqual({ transaksi: 2, berat: 33, nilai: 140000 })
  })

  it("memakai berat AKTUAL, bukan target (BR-11)", async () => {
    const l = await laporanPenjualan({})
    // 18 + 5 + 10 = 33; kalau memakai target angkanya akan berbeda
    expect(l.baris[0].beratAktual).toBe(18)
    expect(l.baris[1].beratAktual).toBe(15)
  })

  it("menggabungkan per bank sampah", async () => {
    const l = await laporanPenjualan({})
    expect(l.perBankSampah).toEqual([
      { nama: "BS Mawar", berat: 33, nilai: 140000, transaksi: 2 },
    ])
  })

  it("memisahkan per pembeli dan mengurutkan dari nilai terbesar", async () => {
    const l = await laporanPenjualan({})
    expect(l.perPembeli.map((r) => r.nama)).toEqual(["PT Daur", "UD Plastik"])
    expect(l.perPembeli[0].nilai).toBe(90000)
  })

  it("per jenis sampah memakai subtotal item, bukan total dispatch", async () => {
    const l = await laporanPenjualan({})
    const pet = l.perJenisSampah.find((r) => r.nama === "PET")
    const kardus = l.perJenisSampah.find((r) => r.nama === "Kardus")
    expect(pet).toEqual({ nama: "PET", berat: 23, nilai: 115000, transaksi: 2 })
    expect(kardus).toEqual({ nama: "Kardus", berat: 10, nilai: 25000, transaksi: 1 })
  })

  it("meneruskan penanda selisih signifikan ke baris", async () => {
    const l = await laporanPenjualan({})
    expect(l.baris[0].selisihSignifikan).toBe(true)
    expect(l.baris[1].selisihSignifikan).toBe(false)
  })

  it("data kosong menghasilkan nol, bukan error", async () => {
    m.dispatch.findMany.mockResolvedValue([])
    const l = await laporanPenjualan({})
    expect(l.ringkasan).toEqual({ transaksi: 0, berat: 0, nilai: 0 })
    expect(l.perBankSampah).toEqual([])
  })

  it("item tanpa berat aktual dihitung nol, tidak NaN", async () => {
    m.dispatch.findMany.mockResolvedValue([
      {
        ...dispatchRow({
          kode: "DSP-3",
          bank: "BS X",
          pembeli: "P",
          nilai: 0,
          items: [{ jenis: "PET", aktual: 0, subtotal: 0 }],
        }),
        items: [{ beratAktual: null, subtotal: null, jenisSampah: { nama: "PET" } }],
      },
    ])
    const l = await laporanPenjualan({})
    expect(l.ringkasan.berat).toBe(0)
    expect(Number.isNaN(l.ringkasan.nilai)).toBe(false)
  })
})

describe("laporanVolume", () => {
  beforeEach(() => {
    m.setoran.findMany.mockResolvedValue([
      setoranRow({
        kode: "SET-1",
        bank: "BS Mawar",
        nasabahId: "n1",
        nasabah: "Hasnah",
        berat: 8.25,
        nilai: 18750,
        items: [
          { jenis: "PET", berat: 3.25, subtotal: 9750 },
          { jenis: "Kardus", berat: 5, subtotal: 9000 },
        ],
      }),
      setoranRow({
        kode: "SET-2",
        bank: "BS Mawar",
        nasabahId: "n1",
        nasabah: "Hasnah",
        berat: 2,
        nilai: 6000,
        cash: false,
        items: [{ jenis: "PET", berat: 2, subtotal: 6000 }],
      }),
    ])
  })

  it("ringkasan menjumlahkan berat dan nilai yang dibayarkan", async () => {
    const l = await laporanVolume({})
    expect(l.ringkasan.setoran).toBe(2)
    expect(l.ringkasan.berat).toBe(10.25)
    expect(l.ringkasan.nilai).toBe(24750)
  })

  it("nasabah dihitung unik, bukan per setoran", async () => {
    const l = await laporanVolume({})
    // dua setoran dari nasabah yang sama
    expect(l.ringkasan.nasabahAktif).toBe(1)
  })

  it("menghitung setoran yang tunainya belum diserahkan (BR-04)", async () => {
    const l = await laporanVolume({})
    expect(l.ringkasan.tunaiBelum).toBe(1)
  })

  it("rincian per jenis sampah diurutkan dari berat terbesar", async () => {
    const l = await laporanVolume({})
    expect(l.perJenisSampah.map((r) => r.nama)).toEqual(["PET", "Kardus"])
    expect(l.perJenisSampah[0].berat).toBe(5.25)
  })

  it("periode disaring pada tanggal setoran", async () => {
    const dari = new Date("2026-08-01")
    await laporanVolume({ dari })
    expect(m.setoran.findMany.mock.calls[0][0].where.tanggal).toEqual({ gte: dari })
  })
})

describe("CSV", () => {
  it("penjualan: header sesuai dan boolean jadi Ya/Tidak", async () => {
    m.dispatch.findMany.mockResolvedValue([
      dispatchRow({
        kode: "DSP-1",
        bank: "BS Mawar",
        pembeli: "PT Daur",
        nilai: 90000,
        items: [{ jenis: "PET", aktual: 18, subtotal: 90000 }],
        selisih: true,
      }),
    ])
    const csv = penjualanKeCsv(await laporanPenjualan({}))
    const [header, baris] = csv.split("\n")
    expect(header).toBe(
      "Kode Dispatch,Tanggal Jemput,Bank Sampah,Pembeli,Berat Aktual (kg),Nilai Penjualan (Rp),Selisih Signifikan",
    )
    expect(baris).toBe("DSP-1,2026-08-10,BS Mawar,PT Daur,18,90000,Ya")
  })

  it("volume: tunai jadi Ya/Belum", async () => {
    m.setoran.findMany.mockResolvedValue([
      setoranRow({
        kode: "SET-1",
        bank: "BS Mawar",
        nasabahId: "n1",
        nasabah: "Hasnah",
        berat: 2,
        nilai: 6000,
        cash: false,
        items: [{ jenis: "PET", berat: 2, subtotal: 6000 }],
      }),
    ])
    const csv = volumeKeCsv(await laporanVolume({}))
    expect(csv.split("\n")[1]).toContain(",Belum")
  })

  it("nama yang memuat koma dikutip supaya kolom tidak bergeser", async () => {
    m.dispatch.findMany.mockResolvedValue([
      dispatchRow({
        kode: "DSP-1",
        bank: "BS Mawar, Unit 2",
        pembeli: "PT Daur",
        nilai: 1,
        items: [{ jenis: "PET", aktual: 1, subtotal: 1 }],
      }),
    ])
    const csv = penjualanKeCsv(await laporanPenjualan({}))
    expect(csv).toContain('"BS Mawar, Unit 2"')
  })

  it("data kosong tetap menghasilkan baris header", async () => {
    const csv = penjualanKeCsv(await laporanPenjualan({}))
    expect(csv.split("\n")).toHaveLength(1)
    expect(csv).toContain("Kode Dispatch")
  })
})
