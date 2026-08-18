import { Prisma } from "@/generated/prisma/client"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { GET, POST } from "@/app/api/kelurahan/route"
import { GET as GET_ID, PUT, DELETE } from "@/app/api/kelurahan/[id]/route"

jest.mock("@/lib/auth", () => ({ requireAuth: jest.fn() }))
jest.mock("@/lib/prisma", () => ({
  prisma: {
    kelurahan: {
      findMany: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  },
}))

const mAuth = requireAuth as jest.Mock
type ModelMock = { findMany: jest.Mock; create: jest.Mock; findFirst: jest.Mock; update: jest.Mock }
const m = prisma.kelurahan as unknown as ModelMock

const authOk = { ok: true, user: { id: "u1" }, authUserId: "u1" }
const unauthorized = { ok: false, response: Response.json({ error: "unauthorized" }, { status: 401 }) }
const prismaError = (code: string) =>
  new Prisma.PrismaClientKnownRequestError("boom", { code, clientVersion: "7.0.0" })
const params = (id: string) => ({ params: Promise.resolve({ id }) })
const json = (res: Response) => res.json()

const validBody = { nama: "Sukamaju", kodeWilayah: "32.01.01" }

describe("GET /api/kelurahan", () => {
  it("mengembalikan daftar kelurahan", async () => {
    mAuth.mockResolvedValue(authOk)
    m.findMany.mockResolvedValue([{ ...validBody, id: "c1" }])
    const res = await GET()
    expect(res.status).toBe(200)
    expect(await json(res)).toEqual([{ ...validBody, id: "c1" }])
    expect(m.findMany).toHaveBeenCalledWith({ where: { deletedAt: null } })
  })

  it("401 jika tidak login", async () => {
    mAuth.mockResolvedValue(unauthorized)
    const res = await GET()
    expect(res.status).toBe(401)
    expect(m.findMany).not.toHaveBeenCalled()
  })
})

describe("POST /api/kelurahan", () => {
  it("membuat kelurahan", async () => {
    mAuth.mockResolvedValue(authOk)
    m.create.mockResolvedValue({ ...validBody, id: "c1" })
    const res = await POST(new Request("http://x", { method: "POST", body: JSON.stringify(validBody) }))
    expect(res.status).toBe(201)
    expect(await json(res)).toEqual({ ...validBody, id: "c1" })
    expect(m.create).toHaveBeenCalledWith({ data: validBody })
  })

  it("400 untuk body tidak valid", async () => {
    mAuth.mockResolvedValue(authOk)
    const res = await POST(new Request("http://x", { method: "POST", body: JSON.stringify({ nama: "" }) }))
    expect(res.status).toBe(400)
    expect(m.create).not.toHaveBeenCalled()
  })

  it("400 untuk body bukan JSON", async () => {
    mAuth.mockResolvedValue(authOk)
    const res = await POST(new Request("http://x", { method: "POST", body: "bukan json" }))
    expect(res.status).toBe(400)
  })

  it("409 jika kodeWilayah sudah dipakai", async () => {
    mAuth.mockResolvedValue(authOk)
    m.create.mockRejectedValue(prismaError("P2002"))
    const res = await POST(new Request("http://x", { method: "POST", body: JSON.stringify(validBody) }))
    expect(res.status).toBe(409)
  })
})

describe("GET /api/kelurahan/[id]", () => {
  it("mengembalikan detail", async () => {
    mAuth.mockResolvedValue(authOk)
    m.findFirst.mockResolvedValue({ ...validBody, id: "c1" })
    const res = await GET_ID(new Request("http://x"), params("c1"))
    expect(res.status).toBe(200)
    expect(await json(res)).toEqual({ ...validBody, id: "c1" })
  })

  it("404 jika tidak ditemukan", async () => {
    mAuth.mockResolvedValue(authOk)
    m.findFirst.mockResolvedValue(null)
    const res = await GET_ID(new Request("http://x"), params("c1"))
    expect(res.status).toBe(404)
  })
})

describe("PUT /api/kelurahan/[id]", () => {
  it("mengupdate kelurahan", async () => {
    mAuth.mockResolvedValue(authOk)
    m.update.mockResolvedValue({ ...validBody, id: "c1" })
    const res = await PUT(new Request("http://x", { method: "PUT", body: JSON.stringify(validBody) }), params("c1"))
    expect(res.status).toBe(200)
    expect(await json(res)).toEqual({ ...validBody, id: "c1" })
    expect(m.update).toHaveBeenCalledWith({ where: { id: "c1" }, data: validBody })
  })

  it("400 untuk body tidak valid", async () => {
    mAuth.mockResolvedValue(authOk)
    const res = await PUT(new Request("http://x", { method: "PUT", body: JSON.stringify({}) }), params("c1"))
    expect(res.status).toBe(400)
  })

  it("404 jika tidak ditemukan", async () => {
    mAuth.mockResolvedValue(authOk)
    m.update.mockRejectedValue(prismaError("P2025"))
    const res = await PUT(new Request("http://x", { method: "PUT", body: JSON.stringify(validBody) }), params("c1"))
    expect(res.status).toBe(404)
  })
})

describe("DELETE /api/kelurahan/[id]", () => {
  it("soft delete → 204", async () => {
    mAuth.mockResolvedValue(authOk)
    m.update.mockResolvedValue({ ...validBody, id: "c1" })
    const res = await DELETE(new Request("http://x"), params("c1"))
    expect(res.status).toBe(204)
    expect(m.update).toHaveBeenCalledWith({ where: { id: "c1" }, data: { deletedAt: expect.any(Date) } })
  })

  it("404 jika tidak ditemukan", async () => {
    mAuth.mockResolvedValue(authOk)
    m.update.mockRejectedValue(prismaError("P2025"))
    const res = await DELETE(new Request("http://x"), params("c1"))
    expect(res.status).toBe(404)
  })
})
