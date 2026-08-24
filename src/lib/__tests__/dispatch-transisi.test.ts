/**
 * State machine dispatch — PRD §8.2 [WAJIB].
 *
 * Tabel transisi, aturan pelaku, dan efek stock (BR-11/BR-12) diuji di sini
 * supaya tidak bergantung pada dev server — mesin build bisa kehabisan RAM,
 * tapi kebenaran state machine tidak boleh ikut tidak terverifikasi.
 */
import { Prisma, type StatusDispatch } from "@/generated/prisma/client"
import { prisma } from "@/lib/prisma"
import { transisiDispatch } from "@/lib/dispatch-transisi"
import type { AppUser } from "@/lib/auth"

jest.mock("@/lib/prisma", () => ({
  prisma: {
    dispatch: { findFirst: jest.fn() },
    stock: { findUnique: jest.fn() },
    $transaction: jest.fn(),
  },
}))

const mPrisma = prisma as unknown as {
  dispatch: { findFirst: jest.Mock }
  stock: { findUnique: jest.Mock }
  $transaction: jest.Mock
}

const BS = "bs-mawar"
const admin = { id: "u-admin", role: "ADMIN", bankSampahId: null } as unknown as AppUser
const pemilik = { id: "u-p1", role: "PETUGAS", bankSampahId: BS } as unknown as AppUser
const petugasLain = {
  id: "u-p2",
  role: "PETUGAS",
  bankSampahId: "bs-melati",
} as unknown as AppUser

const ITEM = {
  id: "it1",
  jenisSampahId: "j-pet",
  beratTarget: new Prisma.Decimal(20),
  hargaJualPerKg: new Prisma.Decimal(5000),
  jenisSampah: { id: "j-pet", nama: "Botol PET" },
}

function dispatchDengan(status: StatusDispatch) {
  return {
    id: "d1",
    kodeDispatch: "DSP-1",
    status,
    bankSampahId: BS,
    totalNilai: null,
    items: [ITEM],
  }
}

function mockTx() {
  const tx = {
    dispatch: {
      update: jest.fn().mockImplementation(({ data }) =>
        Promise.resolve({ id: "d1", ...data, items: [ITEM] }),
      ),
    },
    dispatchItem: { update: jest.fn().mockResolvedValue({}) },
    stock: {
      update: jest.fn().mockResolvedValue({ id: "st1" }),
      findUnique: jest.fn().mockResolvedValue({ id: "st1", berat: new Prisma.Decimal(78.5) }),
    },
    stockMutation: { create: jest.fn().mockResolvedValue({}) },
    auditLog: { create: jest.fn().mockResolvedValue({}) },
  }
  mPrisma.$transaction.mockImplementation((cb: (t: typeof tx) => unknown) => cb(tx))
  return tx
}

beforeEach(() => {
  jest.clearAllMocks()
  // stock cukup: 78.5 berat, 0 reservasi
  mPrisma.stock.findUnique.mockResolvedValue({
    berat: new Prisma.Decimal(78.5),
    beratReservasi: new Prisma.Decimal(0),
  })
})

async function kode(res: Response): Promise<string> {
  return (await res.json()).error.code
}

describe("tabel transisi §8.2", () => {
  const SAH: [StatusDispatch, StatusDispatch, AppUser][] = [
    ["DRAFT", "DISPATCHED", admin],
    ["DRAFT", "DIBATALKAN", admin],
    ["DISPATCHED", "DITERIMA", pemilik],
    ["DISPATCHED", "DIBATALKAN", admin],
    ["DITOLAK", "DRAFT", admin],
    ["DITOLAK", "DIBATALKAN", admin],
    ["DITERIMA", "DIBATALKAN", admin],
  ]

  it.each(SAH)("%s -> %s diizinkan", async (dari, ke, user) => {
    mPrisma.dispatch.findFirst.mockResolvedValue(dispatchDengan(dari))
    mockTx()
    const hasil = await transisiDispatch({ id: "d1", ke, user })
    expect(hasil.ok).toBe(true)
  })

  const TIDAK_SAH: [StatusDispatch, StatusDispatch][] = [
    ["DRAFT", "DITERIMA"],
    ["DRAFT", "SELESAI"],
    ["DRAFT", "SERAH_TERIMA"],
    ["DISPATCHED", "SELESAI"],
    ["DITERIMA", "DITOLAK"],
    ["SERAH_TERIMA", "DITERIMA"],
    // BR-13: SELESAI final, DIBATALKAN final
    ["SELESAI", "DIBATALKAN"],
    ["SELESAI", "SERAH_TERIMA"],
    ["DIBATALKAN", "DRAFT"],
  ]

  it.each(TIDAK_SAH)("%s -> %s ditolak 409", async (dari, ke) => {
    mPrisma.dispatch.findFirst.mockResolvedValue(dispatchDengan(dari))
    const hasil = await transisiDispatch({ id: "d1", ke, user: admin })
    expect(hasil.ok).toBe(false)
    if (hasil.ok) throw new Error("seharusnya ditolak")
    expect(hasil.response.status).toBe(409)
    expect(await kode(hasil.response)).toBe("TRANSISI_TIDAK_VALID")
    expect(mPrisma.$transaction).not.toHaveBeenCalled()
  })

  it("404 kalau dispatch tidak ada", async () => {
    mPrisma.dispatch.findFirst.mockResolvedValue(null)
    const hasil = await transisiDispatch({ id: "x", ke: "DISPATCHED", user: admin })
    expect(hasil.ok).toBe(false)
    if (hasil.ok) throw new Error("seharusnya gagal")
    expect(hasil.response.status).toBe(404)
  })
})

describe("aturan pelaku §8.2", () => {
  it("transisi ADMIN menolak petugas", async () => {
    mPrisma.dispatch.findFirst.mockResolvedValue(dispatchDengan("DRAFT"))
    const hasil = await transisiDispatch({ id: "d1", ke: "DISPATCHED", user: pemilik })
    expect(hasil.ok).toBe(false)
    if (hasil.ok) throw new Error("seharusnya ditolak")
    expect(hasil.response.status).toBe(403)
  })

  it("transisi PETUGAS pemilik menolak admin", async () => {
    mPrisma.dispatch.findFirst.mockResolvedValue(dispatchDengan("DISPATCHED"))
    const hasil = await transisiDispatch({ id: "d1", ke: "DITERIMA", user: admin })
    expect(hasil.ok).toBe(false)
    if (hasil.ok) throw new Error("seharusnya ditolak")
    expect(hasil.response.status).toBe(403)
  })

  it("menolak petugas dari bank sampah lain", async () => {
    mPrisma.dispatch.findFirst.mockResolvedValue(dispatchDengan("DISPATCHED"))
    const hasil = await transisiDispatch({ id: "d1", ke: "DITERIMA", user: petugasLain })
    expect(hasil.ok).toBe(false)
    if (hasil.ok) throw new Error("seharusnya ditolak")
    expect(await kode(hasil.response)).toBe("AKSES_DITOLAK")
  })
})

describe("BR-12 reservasi stock", () => {
  it("DISPATCHED menambah beratReservasi sebesar target", async () => {
    mPrisma.dispatch.findFirst.mockResolvedValue(dispatchDengan("DRAFT"))
    const tx = mockTx()
    await transisiDispatch({ id: "d1", ke: "DISPATCHED", user: admin })
    expect(tx.stock.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { beratReservasi: { increment: ITEM.beratTarget } },
      }),
    )
  })

  it("menolak terbitkan kalau stock tersedia kurang (STOCK_TIDAK_CUKUP)", async () => {
    mPrisma.dispatch.findFirst.mockResolvedValue(dispatchDengan("DRAFT"))
    // 25 berat - 10 reservasi = 15 tersedia, target 20
    mPrisma.stock.findUnique.mockResolvedValue({
      berat: new Prisma.Decimal(25),
      beratReservasi: new Prisma.Decimal(10),
    })
    const hasil = await transisiDispatch({ id: "d1", ke: "DISPATCHED", user: admin })
    expect(hasil.ok).toBe(false)
    if (hasil.ok) throw new Error("seharusnya ditolak")
    expect(hasil.response.status).toBe(422)
    const body = await hasil.response.json()
    expect(body.error.code).toBe("STOCK_TIDAK_CUKUP")
    expect(body.error.message).toContain("15.00")
    expect(mPrisma.$transaction).not.toHaveBeenCalled()
  })

  it("DITOLAK melepas reservasi", async () => {
    mPrisma.dispatch.findFirst.mockResolvedValue(dispatchDengan("DISPATCHED"))
    const tx = mockTx()
    await transisiDispatch({
      id: "d1",
      ke: "DITOLAK",
      user: pemilik,
      alasanTolak: "stock tidak sesuai",
    })
    expect(tx.stock.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { beratReservasi: { decrement: ITEM.beratTarget } },
      }),
    )
  })

  it("DIBATALKAN dari DRAFT tidak menyentuh stock (belum ada reservasi)", async () => {
    mPrisma.dispatch.findFirst.mockResolvedValue(dispatchDengan("DRAFT"))
    const tx = mockTx()
    await transisiDispatch({ id: "d1", ke: "DIBATALKAN", user: admin })
    expect(tx.stock.update).not.toHaveBeenCalled()
  })

  it("DIBATALKAN dari DITERIMA melepas reservasi", async () => {
    mPrisma.dispatch.findFirst.mockResolvedValue(dispatchDengan("DITERIMA"))
    const tx = mockTx()
    await transisiDispatch({ id: "d1", ke: "DIBATALKAN", user: admin })
    expect(tx.stock.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { beratReservasi: { decrement: ITEM.beratTarget } },
      }),
    )
  })
})

describe("DITOLAK butuh alasan", () => {
  it("422 tanpa alasan", async () => {
    mPrisma.dispatch.findFirst.mockResolvedValue(dispatchDengan("DISPATCHED"))
    const hasil = await transisiDispatch({ id: "d1", ke: "DITOLAK", user: pemilik })
    expect(hasil.ok).toBe(false)
    if (hasil.ok) throw new Error("seharusnya ditolak")
    expect(hasil.response.status).toBe(422)
    expect((await hasil.response.json()).error.field).toBe("alasanTolak")
  })

  it("DITOLAK -> DRAFT mengosongkan alasanTolak", async () => {
    mPrisma.dispatch.findFirst.mockResolvedValue(dispatchDengan("DITOLAK"))
    const tx = mockTx()
    await transisiDispatch({ id: "d1", ke: "DRAFT", user: admin })
    expect(tx.dispatch.update.mock.calls[0][0].data.alasanTolak).toBeNull()
  })
})

describe("BR-11 serah terima", () => {
  const serah = (extra: Record<string, unknown> = {}) => ({
    id: "d1",
    ke: "SERAH_TERIMA" as StatusDispatch,
    user: pemilik,
    beratAktual: [{ dispatchItemId: "it1", beratAktual: 19.5 }],
    ...extra,
  })

  beforeEach(() => mPrisma.dispatch.findFirst.mockResolvedValue(dispatchDengan("DITERIMA")))

  it("422 kalau ada item tanpa berat aktual", async () => {
    const hasil = await transisiDispatch({
      id: "d1",
      ke: "SERAH_TERIMA",
      user: pemilik,
      beratAktual: [],
    })
    expect(hasil.ok).toBe(false)
    if (hasil.ok) throw new Error("seharusnya ditolak")
    expect(hasil.response.status).toBe(422)
    expect((await hasil.response.json()).error.field).toBe("beratAktual")
  })

  it("selisih di dalam toleransi 5% tidak butuh alasan", async () => {
    // target 20, aktual 19.5 -> selisih 2.5%
    const tx = mockTx()
    const hasil = await transisiDispatch(serah())
    expect(hasil.ok).toBe(true)
    expect(tx.dispatch.update.mock.calls[0][0].data.selisihSignifikan).toBe(false)
  })

  it("selisih di atas 5% tanpa alasan ditolak", async () => {
    // target 20, aktual 18 -> selisih 10%
    const hasil = await transisiDispatch(
      serah({ beratAktual: [{ dispatchItemId: "it1", beratAktual: 18 }] }),
    )
    expect(hasil.ok).toBe(false)
    if (hasil.ok) throw new Error("seharusnya ditolak")
    expect((await hasil.response.json()).error.field).toBe("alasanSelisih")
  })

  it("selisih di atas 5% dengan alasan menandai selisihSignifikan", async () => {
    const tx = mockTx()
    const hasil = await transisiDispatch(
      serah({
        beratAktual: [{ dispatchItemId: "it1", beratAktual: 18 }],
        alasanSelisih: "sebagian basah",
      }),
    )
    expect(hasil.ok).toBe(true)
    const data = tx.dispatch.update.mock.calls[0][0].data
    expect(data.selisihSignifikan).toBe(true)
    expect(data.alasanSelisih).toBe("sebagian basah")
  })

  it("mengurangi berat dan melepas reservasi secara atomik", async () => {
    const tx = mockTx()
    await transisiDispatch(serah())
    // 78.5 - 19.5 = 59
    expect(tx.stock.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "st1" },
        data: expect.objectContaining({
          beratReservasi: { decrement: ITEM.beratTarget },
        }),
      }),
    )
    expect(tx.stock.update.mock.calls[0][0].data.berat.toString()).toBe("59")
  })

  it("mencatat StockMutation KELUAR", async () => {
    const tx = mockTx()
    await transisiDispatch(serah())
    const m = tx.stockMutation.create.mock.calls[0][0].data
    expect(m.tipe).toBe("KELUAR")
    expect(m.refType).toBe("DISPATCH")
    expect(m.beratSebelum.toString()).toBe("78.5")
    expect(m.beratSesudah.toString()).toBe("59")
  })

  it("menghitung subtotal item dan totalNilai dari berat aktual", async () => {
    const tx = mockTx()
    await transisiDispatch(serah())
    // 19.5 x 5000 = 97500
    expect(tx.dispatchItem.update.mock.calls[0][0].data.subtotal.toString()).toBe("97500")
    expect(tx.dispatch.update.mock.calls[0][0].data.totalNilai.toString()).toBe("97500")
  })

  it("BR-07: menolak kalau stock jadi minus", async () => {
    const tx = mockTx()
    tx.stock.findUnique.mockResolvedValue({ id: "st1", berat: new Prisma.Decimal(5) })
    await expect(
      transisiDispatch(serah({ beratAktual: [{ dispatchItemId: "it1", beratAktual: 19.5 }] })),
    ).rejects.toThrow(/tersedia 5.00 kg/)
  })
})

describe("SELESAI butuh nilai penjualan", () => {
  it("422 kalau totalNilai kosong", async () => {
    mPrisma.dispatch.findFirst.mockResolvedValue(dispatchDengan("SERAH_TERIMA"))
    const hasil = await transisiDispatch({ id: "d1", ke: "SELESAI", user: admin })
    expect(hasil.ok).toBe(false)
    if (hasil.ok) throw new Error("seharusnya ditolak")
    expect((await hasil.response.json()).error.field).toBe("totalNilai")
  })

  it("memakai totalNilai yang sudah tersimpan dari serah terima", async () => {
    mPrisma.dispatch.findFirst.mockResolvedValue({
      ...dispatchDengan("SERAH_TERIMA"),
      totalNilai: new Prisma.Decimal(97500),
    })
    mockTx()
    const hasil = await transisiDispatch({ id: "d1", ke: "SELESAI", user: admin })
    expect(hasil.ok).toBe(true)
  })
})

describe("BR-14 AuditLog setiap transisi", () => {
  it("mencatat before dan after", async () => {
    mPrisma.dispatch.findFirst.mockResolvedValue(dispatchDengan("DRAFT"))
    const tx = mockTx()
    await transisiDispatch({ id: "d1", ke: "DIBATALKAN", user: admin })
    const log = tx.auditLog.create.mock.calls[0][0].data
    expect(log.aksi).toBe("TRANSISI_DISPATCH_DIBATALKAN")
    expect(log.entitas).toBe("Dispatch")
    expect(log.userId).toBe("u-admin")
    expect(log.payloadBefore.status).toBe("DRAFT")
    expect(log.payloadAfter.status).toBe("DIBATALKAN")
  })
})
