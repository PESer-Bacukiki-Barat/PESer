import { Prisma } from "@/generated/prisma/client"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { GET, POST } from "@/app/api/harga-sampah/route"
import { GET as GET_ID, PUT, DELETE } from "@/app/api/harga-sampah/[id]/route"

jest.mock("@/lib/auth", () => ({ requireAuth: jest.fn() }))
jest.mock("@/lib/prisma", () => ({
  prisma: {
    hargaSampah: {
      findMany: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  },
}))

const mAuth = requireAuth as jest.Mock
type ModelMock = { findMany: jest.Mock; create: jest.Mock; findFirst: jest.Mock; update: jest.Mock }
const m = prisma.hargaSampah as unknown as ModelMock

const authOk = { ok: true, user: { id: "u1" } }
const unauthorized = { ok: false, response: Response.json({ error: "unauthorized" }, { status: 401 }) }
const prismaError = (code: string) =>
  new Prisma.PrismaClientKnownRequestError("boom", { code, clientVersion: "7.0.0" })
const params = (id: string) => ({ params: Promise.resolve({ id }) })
const json = (res: Response) => res.json()

const validBody = {
  jenisSampahId: "j1",
  hargaBeli: 5000,
  hargaJual: 6000,
  berlakuMulai: "2026-01-01",
}

const body = (over: object = {}) => new Request("http://x", { method: "POST", body: JSON.stringify({ ...validBody, ...over }) })

describe("GET /api/harga-sampah", () => {
  it("mengembalikan daftar", async () => {
    mAuth.mockResolvedValue(authOk)
    m.findMany.mockResolvedValue([{ ...validBody, id: "h1" }])
    const res = await GET()
    expect(res.status).toBe(200)
    expect(await json(res)).toEqual([{ ...validBody, id: "h1" }])
  })

  it("401 jika tidak login", async () => {
    mAuth.mockResolvedValue(unauthorized)
    expect((await GET()).status).toBe(401)
  })
})

describe("POST /api/harga-sampah", () => {
  it("membuat harga sampah", async () => {
    mAuth.mockResolvedValue(authOk)
    m.create.mockResolvedValue({ ...validBody, id: "h1" })
    const res = await POST(body())
    expect(res.status).toBe(201)
    expect(await json(res)).toEqual({ ...validBody, id: "h1" })
  })

  it("400 untuk body tidak valid", async () => {
    mAuth.mockResolvedValue(authOk)
    expect((await POST(body({ hargaBeli: "bukan angka" }))).status).toBe(400)
    expect(m.create).not.toHaveBeenCalled()
  })

  it("409→400 jika jenisSampahId tidak ditemukan (P2003)", async () => {
    mAuth.mockResolvedValue(authOk)
    m.create.mockRejectedValue(prismaError("P2003"))
    const res = await POST(body())
    expect(res.status).toBe(400)
    expect(await json(res)).toEqual({ error: "jenisSampahId tidak ditemukan" })
  })

  it("400 untuk error lain", async () => {
    mAuth.mockResolvedValue(authOk)
    m.create.mockRejectedValue(new Error("x"))
    expect((await POST(body())).status).toBe(400)
  })
})

describe("GET /api/harga-sampah/[id]", () => {
  it("mengembalikan detail", async () => {
    mAuth.mockResolvedValue(authOk)
    m.findFirst.mockResolvedValue({ ...validBody, id: "h1" })
    expect((await GET_ID(new Request("http://x"), params("h1"))).status).toBe(200)
  })

  it("404 jika tidak ditemukan", async () => {
    mAuth.mockResolvedValue(authOk)
    m.findFirst.mockResolvedValue(null)
    expect((await GET_ID(new Request("http://x"), params("h1"))).status).toBe(404)
  })
})

describe("PUT /api/harga-sampah/[id]", () => {
  it("mengupdate", async () => {
    mAuth.mockResolvedValue(authOk)
    m.update.mockResolvedValue({ ...validBody, id: "h1" })
    const res = await PUT(body(), params("h1"))
    expect(res.status).toBe(200)
    expect(m.update).toHaveBeenCalledWith({ where: { id: "h1" }, data: expect.objectContaining({ jenisSampahId: "j1", hargaBeli: 5000, hargaJual: 6000 }) })
  })

  it("404 jika tidak ditemukan (P2025)", async () => {
    mAuth.mockResolvedValue(authOk)
    m.update.mockRejectedValue(prismaError("P2025"))
    expect((await PUT(body(), params("h1"))).status).toBe(404)
  })

  it("400 jika jenisSampahId tidak ditemukan (P2003)", async () => {
    mAuth.mockResolvedValue(authOk)
    m.update.mockRejectedValue(prismaError("P2003"))
    expect((await PUT(body(), params("h1"))).status).toBe(400)
  })

  it("400 untuk error lain", async () => {
    mAuth.mockResolvedValue(authOk)
    m.update.mockRejectedValue(new Error("x"))
    expect((await PUT(body(), params("h1"))).status).toBe(400)
  })
})

describe("DELETE /api/harga-sampah/[id]", () => {
  it("soft delete → 204", async () => {
    mAuth.mockResolvedValue(authOk)
    expect((await DELETE(new Request("http://x"), params("h1"))).status).toBe(204)
    expect(m.update).toHaveBeenCalledWith({ where: { id: "h1" }, data: { deletedAt: expect.any(Date) } })
  })

  it("404 jika tidak ditemukan", async () => {
    mAuth.mockResolvedValue(authOk)
    m.update.mockRejectedValue(prismaError("P2025"))
    expect((await DELETE(new Request("http://x"), params("h1"))).status).toBe(404)
  })
})
