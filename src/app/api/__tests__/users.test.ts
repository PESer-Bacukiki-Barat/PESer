import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { requireAuth } from "@/lib/auth"
import { GET, POST } from "@/app/api/users/route"
import { GET as GET_ID, PUT, DELETE } from "@/app/api/users/[id]/route"

jest.mock("@/lib/auth", () => ({ requireAuth: jest.fn() }))
jest.mock("bcryptjs", () => ({ hash: jest.fn().mockResolvedValue("hashed") }))
jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findMany: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  },
}))

type ModelMock = { findMany: jest.Mock; create: jest.Mock; findFirst: jest.Mock; update: jest.Mock }

const mAuth = requireAuth as jest.Mock
const mHash = bcrypt.hash as jest.Mock
const m = prisma.user as unknown as ModelMock

beforeEach(() => {
  mAuth.mockReset()
  mHash.mockReset()
  mHash.mockResolvedValue("hashed")
})

const authOk = { ok: true, user: { id: "u1", role: "ADMIN" } }
const unauthorized = { ok: false, response: Response.json({ error: "unauthorized" }, { status: 401 }) }
const forbidden = { ok: false, response: Response.json({ error: "forbidden" }, { status: 403 }) }
const params = (id: string) => ({ params: Promise.resolve({ id }) })
// PRD §2.5: respons dibungkus { success, data } untuk sukses dan
// { success, error: { code, message, field? } } untuk gagal.
const payload = async (res: Response) => (await res.json()).data
const apiErr = async (res: Response) => (await res.json()).error

const validCreate = {
  email: "andi@mail.com",
  password: "rahasia123",
  nama: "Andi",
  role: "ADMIN",
  bankSampahId: null,
}
const validUpdate = { nama: "Andi Baru" }

const body = (over: object = {}) => new Request("http://x", { method: "POST", body: JSON.stringify({ ...validCreate, ...over }) })
const putBody = (over: object = {}) => new Request("http://x", { method: "PUT", body: JSON.stringify({ ...validUpdate, ...over }) })

const userRow = { id: "u1", email: "andi@mail.com", nama: "Andi", role: "ADMIN" }

describe("GET /api/users", () => {
  it("mengembalikan daftar user (role ADMIN)", async () => {
    mAuth.mockResolvedValue(authOk)
    m.findMany.mockResolvedValue([{ ...userRow, bankSampah: null }])
    const res = await GET()
    expect(res.status).toBe(200)
    expect(await payload(res)).toEqual([{ ...userRow, bankSampah: null }])
    expect(mAuth).toHaveBeenCalledWith("ADMIN")
  })

  it("401 jika tidak login", async () => {
    mAuth.mockResolvedValue(unauthorized)
    expect((await GET()).status).toBe(401)
  })

  it("403 jika bukan ADMIN", async () => {
    mAuth.mockResolvedValue(forbidden)
    expect((await GET()).status).toBe(403)
  })
})

describe("POST /api/users", () => {
  it("membuat user + credential", async () => {
    mAuth.mockResolvedValue(authOk)
    m.create.mockResolvedValue({ ...userRow, bankSampah: null })
    const res = await POST(body())
    expect(res.status).toBe(201)
    expect(await payload(res)).toEqual({ ...userRow, bankSampah: null })
    expect(mHash).toHaveBeenCalledWith(validCreate.password, 10)
    expect(m.create).toHaveBeenCalledWith({
      data: {
        email: validCreate.email,
        nama: validCreate.nama,
        role: validCreate.role,
        bankSampahId: null,
        isActive: true,
        credential: { create: { email: validCreate.email, passwordHash: "hashed" } },
      },
      include: { bankSampah: { select: { id: true, nama: true } } },
    })
  })

  it("422 untuk body tidak valid", async () => {
    mAuth.mockResolvedValue(authOk)
    expect((await POST(body({ email: "bukan-email" }))).status).toBe(422)
    expect(m.create).not.toHaveBeenCalled()
  })

  it("422 jika PETUGAS tanpa bankSampahId", async () => {
    mAuth.mockResolvedValue(authOk)
    const res = await POST(body({ role: "PETUGAS", bankSampahId: null }))
    expect(res.status).toBe(422)
  })

  it("409 jika email sudah dipakai", async () => {
    mAuth.mockResolvedValue(authOk)
    m.create.mockRejectedValue(new Error("duplicate"))
    const res = await POST(body())
    expect(res.status).toBe(409)
    expect(await apiErr(res)).toMatchObject({ message: "email sudah dipakai" })
  })
})

describe("GET /api/users/[id]", () => {
  it("mengembalikan detail", async () => {
    mAuth.mockResolvedValue(authOk)
    m.findFirst.mockResolvedValue({ ...userRow, bankSampah: null })
    expect((await GET_ID(new Request("http://x"), params("u1"))).status).toBe(200)
  })

  it("404 jika tidak ditemukan", async () => {
    mAuth.mockResolvedValue(authOk)
    m.findFirst.mockResolvedValue(null)
    expect((await GET_ID(new Request("http://x"), params("u1"))).status).toBe(404)
  })
})

describe("PUT /api/users/[id]", () => {
  it("mengupdate data user", async () => {
    mAuth.mockResolvedValue(authOk)
    m.findFirst.mockResolvedValue({ ...userRow })
    m.update.mockResolvedValue({ ...userRow, nama: validUpdate.nama })
    const res = await PUT(putBody(), params("u1"))
    expect(res.status).toBe(200)
    expect(m.update).toHaveBeenCalledWith({ where: { id: "u1" }, data: validUpdate })
  })

  it("mengupdate email + password (hash ulang)", async () => {
    mAuth.mockResolvedValue(authOk)
    m.findFirst.mockResolvedValue({ ...userRow })
    m.update.mockResolvedValue(userRow)
    const res = await PUT(putBody({ email: "baru@mail.com", password: "passbaru1" }), params("u1"))
    expect(res.status).toBe(200)
    expect(mHash).toHaveBeenCalledWith("passbaru1", 10)
    expect(m.update).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: {
        email: "baru@mail.com",
        nama: validUpdate.nama,
        credential: { update: { email: "baru@mail.com", passwordHash: "hashed" } },
      },
    })
  })

  it("404 jika user tidak ditemukan", async () => {
    mAuth.mockResolvedValue(authOk)
    m.findFirst.mockResolvedValue(null)
    expect((await PUT(putBody(), params("u1"))).status).toBe(404)
  })

  it("422 untuk body tidak valid", async () => {
    mAuth.mockResolvedValue(authOk)
    m.findFirst.mockResolvedValue({ ...userRow })
    expect((await PUT(putBody({ email: "x" }), params("u1"))).status).toBe(422)
  })

  it("409 jika update gagal (email dipakai)", async () => {
    mAuth.mockResolvedValue(authOk)
    m.findFirst.mockResolvedValue({ ...userRow })
    m.update.mockRejectedValue(new Error("duplicate"))
    const res = await PUT(putBody({ email: "baru@mail.com" }), params("u1"))
    expect(res.status).toBe(409)
    expect(await apiErr(res)).toMatchObject({ message: "email sudah dipakai user lain" })
  })
})

describe("DELETE /api/users/[id]", () => {
  it("soft delete user + credential → 204", async () => {
    mAuth.mockResolvedValue(authOk)
    m.findFirst.mockResolvedValue({ ...userRow })
    const res = await DELETE(new Request("http://x"), params("u1"))
    expect(res.status).toBe(204)
    expect(m.update).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: {
        deletedAt: expect.any(Date),
        credential: { update: { deletedAt: expect.any(Date) } },
      },
    })
  })

  it("404 jika tidak ditemukan", async () => {
    mAuth.mockResolvedValue(authOk)
    m.findFirst.mockResolvedValue(null)
    expect((await DELETE(new Request("http://x"), params("u1"))).status).toBe(404)
  })
})