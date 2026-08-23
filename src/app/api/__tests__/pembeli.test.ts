import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { GET, POST } from "@/app/api/pembeli/route"
import { GET as GET_ID, PUT, DELETE } from "@/app/api/pembeli/[id]/route"

jest.mock("@/lib/auth", () => ({ requireAuth: jest.fn() }))
jest.mock("@/lib/prisma", () => ({
  prisma: {
    pembeli: {
      findMany: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  },
}))

const mAuth = requireAuth as jest.Mock
type ModelMock = { findMany: jest.Mock; create: jest.Mock; findFirst: jest.Mock; update: jest.Mock }
const m = prisma.pembeli as unknown as ModelMock

const authOk = { ok: true, user: { id: "u1" } }
const unauthorized = { ok: false, response: Response.json({ error: "unauthorized" }, { status: 401 }) }
const params = (id: string) => ({ params: Promise.resolve({ id }) })
// PRD §2.5: respons dibungkus { success, data } untuk sukses dan
// { success, error: { code, message, field? } } untuk gagal.
const payload = async (res: Response) => (await res.json()).data

const validBody = { nama: "PT Maju", noHp: "0812345", alamat: "Jl. Merdeka" }

const body = (over: object = {}) => new Request("http://x", { method: "POST", body: JSON.stringify({ ...validBody, ...over }) })

describe("GET /api/pembeli", () => {
  it("mengembalikan daftar", async () => {
    mAuth.mockResolvedValue(authOk)
    m.findMany.mockResolvedValue([{ ...validBody, id: "p1" }])
    const res = await GET()
    expect(res.status).toBe(200)
    expect(await payload(res)).toEqual([{ ...validBody, id: "p1" }])
  })

  it("401 jika tidak login", async () => {
    mAuth.mockResolvedValue(unauthorized)
    expect((await GET()).status).toBe(401)
  })
})

describe("POST /api/pembeli", () => {
  it("membuat pembeli", async () => {
    mAuth.mockResolvedValue(authOk)
    m.create.mockResolvedValue({ ...validBody, id: "p1" })
    const res = await POST(body())
    expect(res.status).toBe(201)
    expect(await payload(res)).toEqual({ ...validBody, id: "p1" })
  })

  it("422 untuk body tidak valid", async () => {
    mAuth.mockResolvedValue(authOk)
    expect((await POST(body({ nama: "" }))).status).toBe(422)
    expect(m.create).not.toHaveBeenCalled()
  })

  it("422 untuk body bukan JSON", async () => {
    mAuth.mockResolvedValue(authOk)
    expect((await POST(new Request("http://x", { method: "POST", body: "x" }))).status).toBe(422)
  })
})

describe("GET /api/pembeli/[id]", () => {
  it("mengembalikan detail", async () => {
    mAuth.mockResolvedValue(authOk)
    m.findFirst.mockResolvedValue({ ...validBody, id: "p1" })
    expect((await GET_ID(new Request("http://x"), params("p1"))).status).toBe(200)
  })

  it("404 jika tidak ditemukan", async () => {
    mAuth.mockResolvedValue(authOk)
    m.findFirst.mockResolvedValue(null)
    expect((await GET_ID(new Request("http://x"), params("p1"))).status).toBe(404)
  })
})

describe("PUT /api/pembeli/[id]", () => {
  it("mengupdate", async () => {
    mAuth.mockResolvedValue(authOk)
    m.update.mockResolvedValue({ ...validBody, id: "p1" })
    const res = await PUT(body(), params("p1"))
    expect(res.status).toBe(200)
    expect(m.update).toHaveBeenCalledWith({ where: { id: "p1" }, data: { ...validBody, isActive: true } })
  })

  it("404 jika tidak ditemukan", async () => {
    mAuth.mockResolvedValue(authOk)
    m.update.mockRejectedValue(new Error("P2025"))
    expect((await PUT(body(), params("p1"))).status).toBe(404)
  })
})

describe("DELETE /api/pembeli/[id]", () => {
  it("soft delete → 204", async () => {
    mAuth.mockResolvedValue(authOk)
    expect((await DELETE(new Request("http://x"), params("p1"))).status).toBe(204)
    expect(m.update).toHaveBeenCalledWith({ where: { id: "p1" }, data: { deletedAt: expect.any(Date) } })
  })

  it("404 jika tidak ditemukan", async () => {
    mAuth.mockResolvedValue(authOk)
    m.update.mockRejectedValue(new Error("P2025"))
    expect((await DELETE(new Request("http://x"), params("p1"))).status).toBe(404)
  })
})
