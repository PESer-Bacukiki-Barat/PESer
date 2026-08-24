/**
 * GET /api/stock — FR-C5 (petugas: bank sampahnya) dan FR-C6 (admin: semua).
 * Tidak ada handler tulis di sini: stock hanya berubah lewat transaksi yang
 * juga menulis StockMutation (larangan PRD §8.7), dan itu dijaga di test
 * setoran dan dispatch.
 */
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { GET } from "@/app/api/stock/route"

jest.mock("@/lib/auth", () => ({ requireAuth: jest.fn() }))
jest.mock("@/lib/prisma", () => ({ prisma: { stock: { findMany: jest.fn() } } }))

const mAuth = requireAuth as jest.Mock
const mStock = prisma.stock as unknown as { findMany: jest.Mock }

beforeEach(() => {
  jest.clearAllMocks()
  mStock.findMany.mockResolvedValue([])
})

describe("GET /api/stock", () => {
  it("petugas hanya melihat stock bank sampahnya (FR-C5)", async () => {
    mAuth.mockResolvedValue({
      ok: true,
      user: { id: "u1", role: "PETUGAS", bankSampahId: "bs-mawar" },
    })
    const res = await GET()
    expect(res.status).toBe(200)
    expect(mStock.findMany.mock.calls[0][0].where).toEqual({ bankSampahId: "bs-mawar" })
  })

  it("admin melihat seluruh bank sampah (FR-C6)", async () => {
    mAuth.mockResolvedValue({ ok: true, user: { id: "u2", role: "ADMIN", bankSampahId: null } })
    const res = await GET()
    expect(res.status).toBe(200)
    expect(mStock.findMany.mock.calls[0][0].where).toEqual({})
  })

  it("403 kalau petugas belum ditugaskan ke bank sampah", async () => {
    mAuth.mockResolvedValue({
      ok: true,
      user: { id: "u3", role: "PETUGAS", bankSampahId: null },
    })
    const res = await GET()
    expect(res.status).toBe(403)
    expect(mStock.findMany).not.toHaveBeenCalled()
  })

  it("meneruskan penolakan requireAuth", async () => {
    mAuth.mockResolvedValue({
      ok: false,
      response: Response.json({ success: false }, { status: 401 }),
    })
    const res = await GET()
    expect(res.status).toBe(401)
    expect(mStock.findMany).not.toHaveBeenCalled()
  })

  it("membungkus hasil dalam envelope PRD §2.5", async () => {
    mAuth.mockResolvedValue({ ok: true, user: { id: "u2", role: "ADMIN", bankSampahId: null } })
    mStock.findMany.mockResolvedValue([{ id: "st1", berat: "10.00" }])
    const body = await (await GET()).json()
    expect(body).toEqual({ success: true, data: [{ id: "st1", berat: "10.00" }] })
  })
})
