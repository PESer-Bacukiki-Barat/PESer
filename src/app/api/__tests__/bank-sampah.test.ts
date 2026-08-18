import { Prisma } from "@/generated/prisma/client"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { GET, POST } from "@/app/api/bank-sampah/route"
import { GET as GET_ID, PUT, DELETE } from "@/app/api/bank-sampah/[id]/route"

jest.mock("@/lib/auth", () => ({ requireAuth: jest.fn() }))
jest.mock("@/lib/prisma", () => ({
  prisma: {
    bankSampah: {
      findMany: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  },
}))

const mAuth = requireAuth as jest.Mock
type ModelMock = { findMany: jest.Mock; create: jest.Mock; findFirst: jest.Mock; update: jest.Mock }
const m = prisma.bankSampah as unknown as ModelMock

const authOk = { ok: true, user: { id: "u1" } }
const unauthorized = { ok: false, response: Response.json({ error: "unauthorized" }, { status: 401 }) }
const prismaError = (code: string) =>
  new Prisma.PrismaClientKnownRequestError("boom", { code, clientVersion: "7.0.0" })
const params = (id: string) => ({ params: Promise.resolve({ id }) })
const json = (res: Response) => res.json()

const validBody = {
  nama: "Bank Hijau",
  kelurahanId: "k1",
  alamat: "Jl. Melati 1",
  latitude: -6.2,
  longitude: 106.8,
}

const body = (over: object = {}) => new Request("http://x", { method: "POST", body: JSON.stringify({ ...validBody, ...over }) })

describe("GET /api/bank-sampah", () => {
  it("mengembalikan daftar", async () => {
    mAuth.mockResolvedValue(authOk)
    m.findMany.mockResolvedValue([{ ...validBody, id: "b1" }])
    const res = await GET()
    expect(res.status).toBe(200)
    expect(await json(res)).toEqual([{ ...validBody, id: "b1" }])
    expect(m.findMany).toHaveBeenCalledWith({ where: { deletedAt: null } })
  })

  it("401 jika tidak login", async () => {
    mAuth.mockResolvedValue(unauthorized)
    expect((await GET()).status).toBe(401)
    expect(m.findMany).not.toHaveBeenCalled()
  })
})

describe("POST /api/bank-sampah", () => {
  it("membuat bank sampah", async () => {
    mAuth.mockResolvedValue(authOk)
    m.create.mockResolvedValue({ ...validBody, id: "b1" })
    const res = await POST(body())
    expect(res.status).toBe(201)
    expect(await json(res)).toEqual({ ...validBody, id: "b1" })
  })

  it("400 untuk body tidak valid", async () => {
    mAuth.mockResolvedValue(authOk)
    expect((await POST(body({ nama: "" }))).status).toBe(400)
    expect(m.create).not.toHaveBeenCalled()
  })

  it("400 untuk body bukan JSON", async () => {
    mAuth.mockResolvedValue(authOk)
    expect((await POST(new Request("http://x", { method: "POST", body: "x" }))).status).toBe(400)
  })

  it("409 jika kelurahanId sudah punya bank sampah (P2002)", async () => {
    mAuth.mockResolvedValue(authOk)
    m.create.mockRejectedValue(prismaError("P2002"))
    const res = await POST(body())
    expect(res.status).toBe(409)
    expect(await json(res)).toEqual({ error: "kelurahanId sudah punya bank sampah" })
  })

  it("400 jika kelurahanId tidak ditemukan (P2003)", async () => {
    mAuth.mockResolvedValue(authOk)
    m.create.mockRejectedValue(prismaError("P2003"))
    const res = await POST(body())
    expect(res.status).toBe(400)
    expect(await json(res)).toEqual({ error: "kelurahanId tidak ditemukan" })
  })

  it("400 untuk error prisma lain", async () => {
    mAuth.mockResolvedValue(authOk)
    m.create.mockRejectedValue(new Error("apa pun"))
    const res = await POST(body())
    expect(res.status).toBe(400)
    expect(await json(res)).toEqual({ error: "gagal membuat bank sampah" })
  })
})

describe("GET /api/bank-sampah/[id]", () => {
  it("mengembalikan detail", async () => {
    mAuth.mockResolvedValue(authOk)
    m.findFirst.mockResolvedValue({ ...validBody, id: "b1" })
    const res = await GET_ID(new Request("http://x"), params("b1"))
    expect(res.status).toBe(200)
    expect(await json(res)).toEqual({ ...validBody, id: "b1" })
  })

  it("404 jika tidak ditemukan", async () => {
    mAuth.mockResolvedValue(authOk)
    m.findFirst.mockResolvedValue(null)
    expect((await GET_ID(new Request("http://x"), params("b1"))).status).toBe(404)
  })
})

describe("PUT /api/bank-sampah/[id]", () => {
  it("mengupdate", async () => {
    mAuth.mockResolvedValue(authOk)
    m.update.mockResolvedValue({ ...validBody, id: "b1" })
    const res = await PUT(body(), params("b1"))
    expect(res.status).toBe(200)
    expect(await json(res)).toEqual({ ...validBody, id: "b1" })
    expect(m.update).toHaveBeenCalledWith({ where: { id: "b1" }, data: { ...validBody, isActive: true } })
  })

  it("404 jika tidak ditemukan (P2025)", async () => {
    mAuth.mockResolvedValue(authOk)
    m.update.mockRejectedValue(prismaError("P2025"))
    expect((await PUT(body(), params("b1"))).status).toBe(404)
  })

  it("409 jika kelurahanId sudah dipakai (P2002)", async () => {
    mAuth.mockResolvedValue(authOk)
    m.update.mockRejectedValue(prismaError("P2002"))
    expect((await PUT(body(), params("b1"))).status).toBe(409)
  })

  it("400 jika kelurahanId tidak ditemukan (P2003)", async () => {
    mAuth.mockResolvedValue(authOk)
    m.update.mockRejectedValue(prismaError("P2003"))
    expect((await PUT(body(), params("b1"))).status).toBe(400)
  })

  it("400 untuk error lain", async () => {
    mAuth.mockResolvedValue(authOk)
    m.update.mockRejectedValue(new Error("x"))
    expect((await PUT(body(), params("b1"))).status).toBe(400)
  })
})

describe("DELETE /api/bank-sampah/[id]", () => {
  it("soft delete → 204", async () => {
    mAuth.mockResolvedValue(authOk)
    const res = await DELETE(new Request("http://x"), params("b1"))
    expect(res.status).toBe(204)
    expect(m.update).toHaveBeenCalledWith({ where: { id: "b1" }, data: { deletedAt: expect.any(Date) } })
  })

  it("404 jika tidak ditemukan", async () => {
    mAuth.mockResolvedValue(authOk)
    m.update.mockRejectedValue(prismaError("P2025"))
    expect((await DELETE(new Request("http://x"), params("b1"))).status).toBe(404)
  })
})
