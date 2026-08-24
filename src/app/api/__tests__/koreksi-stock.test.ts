/**
 * POST/GET /api/koreksi-stock — FR-C7 (koreksi langsung) & FR-C8 (riwayat).
 *
 * Fokus utamanya invarian yang sebelumnya bocor: koreksi bisa menurunkan berat
 * di bawah jumlah yang sudah direservasi dispatch berjalan, sehingga stock
 * tersedia menjadi negatif dan dispatch memegang klaim atas barang yang tidak
 * ada lagi (BR-12).
 */
import { Prisma } from "@/generated/prisma/client"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { GET, POST } from "@/app/api/koreksi-stock/route"

jest.mock("@/lib/auth", () => ({ requireAuth: jest.fn() }))
jest.mock("@/lib/prisma", () => {
  const m = {
    stock: { findFirst: jest.fn(), update: jest.fn() },
    koreksiStock: { findMany: jest.fn(), create: jest.fn() },
    stockMutation: { create: jest.fn() },
    auditLog: { create: jest.fn() },
    $transaction: jest.fn(),
  }
  return { prisma: m }
})

const mAuth = requireAuth as jest.Mock
const m = prisma as unknown as {
  stock: { findFirst: jest.Mock; update: jest.Mock }
  koreksiStock: { findMany: jest.Mock; create: jest.Mock }
  stockMutation: { create: jest.Mock }
  auditLog: { create: jest.Mock }
  $transaction: jest.Mock
}

const petugas = {
  ok: true,
  user: { id: "u1", role: "PETUGAS", bankSampah: { id: "bs-mawar" } },
}
const admin = { ok: true, user: { id: "u2", role: "ADMIN", bankSampah: null } }
const forbidden = {
  ok: false,
  response: Response.json({ success: false }, { status: 403 }),
}

const post = (body: unknown) =>
  new Request("http://x/api/koreksi-stock", { method: "POST", body: JSON.stringify(body) })

/** stock dengan berat 100 dan reservasi tertentu */
const stockDengan = (reservasi: number) => ({
  id: "st1",
  berat: new Prisma.Decimal(100),
  beratReservasi: new Prisma.Decimal(reservasi),
})

beforeEach(() => {
  mAuth.mockResolvedValue(petugas)
  m.$transaction.mockImplementation((cb: (t: typeof prisma) => unknown) => cb(prisma))
  m.koreksiStock.create.mockResolvedValue({ id: "k1" })
  m.stock.update.mockResolvedValue({ id: "st1" })
})

describe("POST /api/koreksi-stock — guard", () => {
  it("hanya untuk PETUGAS (FR-C7)", async () => {
    mAuth.mockResolvedValue(forbidden)
    const res = await POST(post({ stockId: "st1", beratBaru: 50, alasan: "x" }))
    expect(mAuth).toHaveBeenCalledWith("PETUGAS")
    expect(res.status).toBe(403)
  })

  it("404 kalau stock bukan milik bank sampah petugas", async () => {
    m.stock.findFirst.mockResolvedValue(null)
    const res = await POST(post({ stockId: "st1", beratBaru: 50, alasan: "timbang ulang" }))
    expect(res.status).toBe(404)
    // scope diambil dari sesi, bukan dari body
    expect(m.stock.findFirst).toHaveBeenCalledWith({
      where: { id: "st1", bankSampahId: "bs-mawar" },
    })
  })

  it("422 kalau alasan kosong", async () => {
    const res = await POST(post({ stockId: "st1", beratBaru: 50, alasan: "" }))
    expect(res.status).toBe(422)
    expect(m.$transaction).not.toHaveBeenCalled()
  })

  it("422 kalau berat negatif (BR-07)", async () => {
    const res = await POST(post({ stockId: "st1", beratBaru: -1, alasan: "x" }))
    expect(res.status).toBe(422)
    expect(m.$transaction).not.toHaveBeenCalled()
  })
})

describe("POST /api/koreksi-stock — invarian reservasi (BR-12)", () => {
  it("menolak koreksi di bawah berat yang direservasi", async () => {
    m.stock.findFirst.mockResolvedValue(stockDengan(30))
    const res = await POST(post({ stockId: "st1", beratBaru: 20, alasan: "susut" }))
    expect(res.status).toBe(422)
    const body = await res.json()
    expect(body.error.code).toBe("STOCK_TIDAK_CUKUP")
    expect(body.error.message).toContain("30.00")
    expect(body.error.field).toBe("beratBaru")
    // penting: transaksi tidak pernah dimulai
    expect(m.$transaction).not.toHaveBeenCalled()
  })

  it("menerima koreksi tepat di batas reservasi", async () => {
    m.stock.findFirst.mockResolvedValue(stockDengan(30))
    const res = await POST(post({ stockId: "st1", beratBaru: 30, alasan: "susut" }))
    expect(res.status).toBe(201)
  })

  it("tanpa reservasi, boleh turun sampai nol", async () => {
    m.stock.findFirst.mockResolvedValue(stockDengan(0))
    const res = await POST(post({ stockId: "st1", beratBaru: 0, alasan: "habis terjual" }))
    expect(res.status).toBe(201)
  })

  it("menaikkan stock tidak pernah terhalang reservasi", async () => {
    m.stock.findFirst.mockResolvedValue(stockDengan(90))
    const res = await POST(post({ stockId: "st1", beratBaru: 150, alasan: "temuan" }))
    expect(res.status).toBe(201)
  })
})

describe("POST /api/koreksi-stock — jejak", () => {
  beforeEach(() => m.stock.findFirst.mockResolvedValue(stockDengan(0)))

  it("mencatat StockMutation ADJUST dengan selisih", async () => {
    await POST(post({ stockId: "st1", beratBaru: 80, alasan: "susut air" }))
    const mut = m.stockMutation.create.mock.calls[0][0].data
    expect(mut.tipe).toBe("ADJUST")
    // 80 - 100 = -20
    expect(Number(mut.berat)).toBe(-20)
    expect(Number(mut.beratSebelum)).toBe(100)
    expect(Number(mut.beratSesudah)).toBe(80)
  })

  it("mencatat KoreksiStock beserta alasan dan pelakunya", async () => {
    await POST(post({ stockId: "st1", beratBaru: 80, alasan: "susut air" }))
    const k = m.koreksiStock.create.mock.calls[0][0].data
    expect(k.alasan).toBe("susut air")
    expect(k.dilakukanOlehId).toBe("u1")
  })

  it("menulis AuditLog di transaksi yang sama", async () => {
    await POST(post({ stockId: "st1", beratBaru: 80, alasan: "susut air" }))
    expect(m.$transaction).toHaveBeenCalledTimes(1)
    expect(m.auditLog.create).toHaveBeenCalledTimes(1)
  })
})

describe("GET /api/koreksi-stock — FR-C8", () => {
  beforeEach(() => m.koreksiStock.findMany.mockResolvedValue([]))

  it("petugas dibatasi ke bank sampahnya", async () => {
    const res = await GET()
    expect(res.status).toBe(200)
    expect(m.koreksiStock.findMany.mock.calls[0][0].where).toEqual({
      stock: { bankSampahId: "bs-mawar" },
    })
  })

  it("admin melihat semua bank sampah", async () => {
    mAuth.mockResolvedValue(admin)
    await GET()
    expect(m.koreksiStock.findMany.mock.calls[0][0].where).toEqual({})
  })

  it("menyertakan relasi supaya riwayat bisa dibaca manusia", async () => {
    await GET()
    const include = m.koreksiStock.findMany.mock.calls[0][0].include
    expect(include).toHaveProperty("dilakukanOleh")
    expect(include).toHaveProperty("stock")
  })
})
