import { Prisma } from "@/generated/prisma/client"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { GET, POST } from "@/app/api/jenis-sampah/route"
import { GET as GET_ID, PUT, DELETE } from "@/app/api/jenis-sampah/[id]/route"

jest.mock("@/lib/auth", () => ({ requireAuth: jest.fn() }))
jest.mock("@/lib/prisma", () => ({
  prisma: {
    jenisSampah: {
      findMany: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  },
}))

const mAuth = requireAuth as jest.Mock
type ModelMock = { findMany: jest.Mock; create: jest.Mock; findFirst: jest.Mock; update: jest.Mock }
const m = prisma.jenisSampah as unknown as ModelMock

const authOk = { ok: true, user: { id: "u1" } }
const unauthorized = { ok: false, response: Response.json({ error: "unauthorized" }, { status: 401 }) }
const prismaError = (code: string) =>
  new Prisma.PrismaClientKnownRequestError("boom", { code, clientVersion: "7.0.0" })
const params = (id: string) => ({ params: Promise.resolve({ id }) })
const json = (res: Response) => res.json()

const validBody = { kode: 1, nama: "Plastik", kategori: "PLASTIK", satuan: "KG" }

const body = (over: object = {}) => new Request("http://x", { method: "POST", body: JSON.stringify({ ...validBody, ...over }) })

describe("GET /api/jenis-sampah", () => {
  it("mengembalikan daftar", async () => {
    mAuth.mockResolvedValue(authOk)
    m.findMany.mockResolvedValue([{ ...validBody, id: "j1" }])
    const res = await GET()
    expect(res.status).toBe(200)
    expect(await json(res)).toEqual([{ ...validBody, id: "j1" }])
  })

  it("401 jika tidak login", async () => {
    mAuth.mockResolvedValue(unauthorized)
    expect((await GET()).status).toBe(401)
  })
})

describe("POST /api/jenis-sampah", () => {
  it("membuat jenis sampah", async () => {
    mAuth.mockResolvedValue(authOk)
    m.create.mockResolvedValue({ ...validBody, id: "j1" })
    const res = await POST(body())
    expect(res.status).toBe(201)
    expect(await json(res)).toEqual({ ...validBody, id: "j1" })
  })

  it("400 untuk body tidak valid", async () => {
    mAuth.mockResolvedValue(authOk)
    expect((await POST(body({ kode: -1 }))).status).toBe(400)
    expect(m.create).not.toHaveBeenCalled()
  })

  it("409 jika kode sudah dipakai (P2002)", async () => {
    mAuth.mockResolvedValue(authOk)
    m.create.mockRejectedValue(prismaError("P2002"))
    const res = await POST(body())
    expect(res.status).toBe(409)
    expect(await json(res)).toEqual({ error: "kode sudah dipakai" })
  })

  it("400 untuk error lain", async () => {
    mAuth.mockResolvedValue(authOk)
    m.create.mockRejectedValue(new Error("x"))
    expect((await POST(body())).status).toBe(400)
  })
})

describe("GET /api/jenis-sampah/[id]", () => {
  it("mengembalikan detail", async () => {
    mAuth.mockResolvedValue(authOk)
    m.findFirst.mockResolvedValue({ ...validBody, id: "j1" })
    expect((await GET_ID(new Request("http://x"), params("j1"))).status).toBe(200)
  })

  it("404 jika tidak ditemukan", async () => {
    mAuth.mockResolvedValue(authOk)
    m.findFirst.mockResolvedValue(null)
    expect((await GET_ID(new Request("http://x"), params("j1"))).status).toBe(404)
  })
})

describe("PUT /api/jenis-sampah/[id]", () => {
  it("mengupdate", async () => {
    mAuth.mockResolvedValue(authOk)
    m.update.mockResolvedValue({ ...validBody, id: "j1" })
    const res = await PUT(body(), params("j1"))
    expect(res.status).toBe(200)
    expect(m.update).toHaveBeenCalledWith({ where: { id: "j1" }, data: { ...validBody, isActive: true } })
  })

  it("404 jika tidak ditemukan (P2025)", async () => {
    mAuth.mockResolvedValue(authOk)
    m.update.mockRejectedValue(prismaError("P2025"))
    expect((await PUT(body(), params("j1"))).status).toBe(404)
  })

  it("409 jika kode sudah dipakai (P2002)", async () => {
    mAuth.mockResolvedValue(authOk)
    m.update.mockRejectedValue(prismaError("P2002"))
    expect((await PUT(body(), params("j1"))).status).toBe(409)
  })

  it("400 untuk error lain", async () => {
    mAuth.mockResolvedValue(authOk)
    m.update.mockRejectedValue(new Error("x"))
    expect((await PUT(body(), params("j1"))).status).toBe(400)
  })
})

describe("DELETE /api/jenis-sampah/[id]", () => {
  it("soft delete → 204", async () => {
    mAuth.mockResolvedValue(authOk)
    expect((await DELETE(new Request("http://x"), params("j1"))).status).toBe(204)
    expect(m.update).toHaveBeenCalledWith({ where: { id: "j1" }, data: { deletedAt: expect.any(Date) } })
  })

  it("404 jika tidak ditemukan", async () => {
    mAuth.mockResolvedValue(authOk)
    m.update.mockRejectedValue(prismaError("P2025"))
    expect((await DELETE(new Request("http://x"), params("j1"))).status).toBe(404)
  })
})
