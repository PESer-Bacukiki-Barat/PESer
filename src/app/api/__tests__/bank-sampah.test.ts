import { Prisma } from "@/generated/prisma/client"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { GET, POST } from "@/app/api/bank-sampah/route"
import { GET as GET_ID, PUT, DELETE } from "@/app/api/bank-sampah/[id]/route"

jest.mock("@/lib/auth", () => ({ requireAuth: jest.fn() }))
jest.mock("@/lib/prisma", () => {
  // Handler tulis kini menjalankan operasi + AuditLog dalam satu
  // $transaction (PRD §2.5 aturan 2). tx diarahkan ke objek mock yang
  // sama supaya assertion pada model tetap berlaku apa adanya.
  const m = {
    bankSampah: {
      findMany: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    auditLog: { create: jest.fn() },
    $transaction: jest.fn(),
  }
  m.$transaction.mockImplementation((cb: (t: typeof m) => unknown) => cb(m))
  return { prisma: m }
})

const mAuth = requireAuth as jest.Mock
type ModelMock = { findMany: jest.Mock; create: jest.Mock; findFirst: jest.Mock; update: jest.Mock }
const m = prisma.bankSampah as unknown as ModelMock

const authOk = { ok: true, user: { id: "u1" } }
const unauthorized = { ok: false, response: Response.json({ error: "unauthorized" }, { status: 401 }) }
const prismaError = (code: string) =>
  new Prisma.PrismaClientKnownRequestError("boom", { code, clientVersion: "7.0.0" })
const params = (id: string) => ({ params: Promise.resolve({ id }) })
// PRD §2.5: respons dibungkus { success, data } untuk sukses dan
// { success, error: { code, message, field? } } untuk gagal.
const payload = async (res: Response) => (await res.json()).data
const apiErr = async (res: Response) => (await res.json()).error

const validBody = {
  nama: "Bank Hijau",
  kelurahanId: "k1",
  alamat: "Jl. Melati 1",
  latitude: -6.2,
  longitude: 106.8,
}

const body = (over: object = {}) => new Request("http://x", { method: "POST", body: JSON.stringify({ ...validBody, ...over }) })

// jest.config.mjs memakai resetMocks: true, yang menghapus implementasi mock
// sebelum setiap test — termasuk $transaction. Jadi dipasang ulang di sini,
// bukan di factory jest.mock.
const mTx = prisma as unknown as { $transaction: jest.Mock }
beforeEach(() => {
  mTx.$transaction.mockImplementation((cb: (t: typeof prisma) => unknown) => cb(prisma))
})

describe("GET /api/bank-sampah", () => {
  it("mengembalikan daftar", async () => {
    mAuth.mockResolvedValue(authOk)
    m.findMany.mockResolvedValue([{ ...validBody, id: "b1" }])
    const res = await GET()
    expect(res.status).toBe(200)
    expect(await payload(res)).toEqual([{ ...validBody, id: "b1" }])
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
    expect(await payload(res)).toEqual({ ...validBody, id: "b1" })
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

  it("409 jika kelurahanId sudah punya bank sampah (P2002)", async () => {
    mAuth.mockResolvedValue(authOk)
    m.create.mockRejectedValue(prismaError("P2002"))
    const res = await POST(body())
    expect(res.status).toBe(409)
    expect(await apiErr(res)).toMatchObject({ message: "kelurahanId sudah punya bank sampah" })
  })

  it("422 jika kelurahanId tidak ditemukan (P2003)", async () => {
    mAuth.mockResolvedValue(authOk)
    m.create.mockRejectedValue(prismaError("P2003"))
    const res = await POST(body())
    expect(res.status).toBe(422)
    expect(await apiErr(res)).toMatchObject({ message: "kelurahanId tidak ditemukan" })
  })

  it("400 untuk error prisma lain", async () => {
    mAuth.mockResolvedValue(authOk)
    m.create.mockRejectedValue(new Error("apa pun"))
    const res = await POST(body())
    expect(res.status).toBe(400)
    expect(await apiErr(res)).toMatchObject({ message: "gagal membuat bank sampah" })
  })
})

describe("GET /api/bank-sampah/[id]", () => {
  it("mengembalikan detail", async () => {
    mAuth.mockResolvedValue(authOk)
    m.findFirst.mockResolvedValue({ ...validBody, id: "b1" })
    const res = await GET_ID(new Request("http://x"), params("b1"))
    expect(res.status).toBe(200)
    expect(await payload(res)).toEqual({ ...validBody, id: "b1" })
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
    expect(await payload(res)).toEqual({ ...validBody, id: "b1" })
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

  it("422 jika kelurahanId tidak ditemukan (P2003)", async () => {
    mAuth.mockResolvedValue(authOk)
    m.update.mockRejectedValue(prismaError("P2003"))
    expect((await PUT(body(), params("b1"))).status).toBe(422)
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
    // handler memakai hasil update untuk entitasId di AuditLog
    m.update.mockResolvedValue({ id: "b1" })
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
