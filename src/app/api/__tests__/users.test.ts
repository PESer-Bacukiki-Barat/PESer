import { prisma } from "@/lib/prisma"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { requireAuth } from "@/lib/auth"
import { GET, POST } from "@/app/api/users/route"
import { GET as GET_ID, PUT, DELETE } from "@/app/api/users/[id]/route"

jest.mock("@/lib/auth", () => ({ requireAuth: jest.fn() }))
jest.mock("@/lib/supabase-admin", () => ({
  supabaseAdmin: {
    auth: {
      admin: {
        createUser: jest.fn(),
        deleteUser: jest.fn(),
        updateUserById: jest.fn(),
      },
    },
  },
}))
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
type AdminMock = { createUser: jest.Mock; deleteUser: jest.Mock; updateUserById: jest.Mock }

const mAuth = requireAuth as jest.Mock
const mAdmin = supabaseAdmin.auth.admin as unknown as AdminMock
const m = prisma.user as unknown as ModelMock

const authOk = { ok: true, user: { id: "u1", role: "ADMIN" }, authUserId: "u1" }
const unauthorized = { ok: false, response: Response.json({ error: "unauthorized" }, { status: 401 }) }
const forbidden = { ok: false, response: Response.json({ error: "forbidden" }, { status: 403 }) }
const params = (id: string) => ({ params: Promise.resolve({ id }) })
const json = (res: Response) => res.json()

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

const userRow = { id: "u1", authUserId: "au1", email: "andi@mail.com", nama: "Andi", role: "ADMIN" }

describe("GET /api/users", () => {
  it("mengembalikan daftar user (role ADMIN)", async () => {
    mAuth.mockResolvedValue(authOk)
    m.findMany.mockResolvedValue([{ ...userRow, bankSampah: null }])
    const res = await GET()
    expect(res.status).toBe(200)
    expect(await json(res)).toEqual([{ ...userRow, bankSampah: null }])
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
  it("membuat user + akun Supabase", async () => {
    mAuth.mockResolvedValue(authOk)
    mAdmin.createUser.mockResolvedValue({ data: { user: { id: "au1" } }, error: null })
    m.create.mockResolvedValue({ ...userRow, bankSampah: null })
    const res = await POST(body())
    expect(res.status).toBe(201)
    expect(await json(res)).toEqual({ ...userRow, bankSampah: null })
    expect(mAdmin.createUser).toHaveBeenCalledWith({ email: validCreate.email, password: validCreate.password, email_confirm: true })
    expect(m.create).toHaveBeenCalledWith({
      data: { email: validCreate.email, nama: validCreate.nama, role: validCreate.role, bankSampahId: null, isActive: true, authUserId: "au1" },
    })
  })

  it("400 untuk body tidak valid", async () => {
    mAuth.mockResolvedValue(authOk)
    expect((await POST(body({ email: "bukan-email" }))).status).toBe(400)
    expect(mAdmin.createUser).not.toHaveBeenCalled()
  })

  it("400 jika PETUGAS tanpa bankSampahId", async () => {
    mAuth.mockResolvedValue(authOk)
    const res = await POST(body({ role: "PETUGAS", bankSampahId: null }))
    expect(res.status).toBe(400)
  })

  it("409 jika createUser gagal", async () => {
    mAuth.mockResolvedValue(authOk)
    mAdmin.createUser.mockResolvedValue({ data: { user: null }, error: { message: "email terdaftar" } })
    const res = await POST(body())
    expect(res.status).toBe(409)
    expect(await json(res)).toEqual({ error: "email terdaftar" })
  })

  it("409 jika prisma create gagal, akun Supabase di-rollback", async () => {
    mAuth.mockResolvedValue(authOk)
    mAdmin.createUser.mockResolvedValue({ data: { user: { id: "au1" } }, error: null })
    m.create.mockRejectedValue(new Error("duplicate"))
    mAdmin.deleteUser.mockResolvedValue(undefined)
    const res = await POST(body())
    expect(res.status).toBe(409)
    expect(await json(res)).toEqual({ error: "email sudah dipakai" })
    expect(mAdmin.deleteUser).toHaveBeenCalledWith("au1")
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
    m.findFirst.mockResolvedValue({ ...userRow, authUserId: "au1" })
    m.update.mockResolvedValue({ ...userRow, nama: validUpdate.nama })
    const res = await PUT(putBody(), params("u1"))
    expect(res.status).toBe(200)
    expect(m.update).toHaveBeenCalledWith({ where: { id: "u1" }, data: validUpdate })
    expect(mAdmin.updateUserById).not.toHaveBeenCalled()
  })

  it("mengupdate email + password ke Supabase", async () => {
    mAuth.mockResolvedValue(authOk)
    m.findFirst.mockResolvedValue({ ...userRow, authUserId: "au1" })
    mAdmin.updateUserById.mockResolvedValue({ error: null })
    m.update.mockResolvedValue(userRow)
    const res = await PUT(putBody({ email: "baru@mail.com", password: "passbaru1" }), params("u1"))
    expect(res.status).toBe(200)
    expect(mAdmin.updateUserById).toHaveBeenCalledWith("au1", { email: "baru@mail.com", password: "passbaru1" })
    expect(m.update).toHaveBeenCalledWith({ where: { id: "u1" }, data: { email: "baru@mail.com", nama: validUpdate.nama } })
  })

  it("404 jika user tidak ditemukan", async () => {
    mAuth.mockResolvedValue(authOk)
    m.findFirst.mockResolvedValue(null)
    expect((await PUT(putBody(), params("u1"))).status).toBe(404)
  })

  it("400 untuk body tidak valid", async () => {
    mAuth.mockResolvedValue(authOk)
    m.findFirst.mockResolvedValue({ ...userRow, authUserId: "au1" })
    expect((await PUT(putBody({ email: "x" }), params("u1"))).status).toBe(400)
  })

  it("409 jika update Supabase gagal", async () => {
    mAuth.mockResolvedValue(authOk)
    m.findFirst.mockResolvedValue({ ...userRow, authUserId: "au1" })
    mAdmin.updateUserById.mockResolvedValue({ error: { message: "email dipakai" } })
    const res = await PUT(putBody({ email: "baru@mail.com" }), params("u1"))
    expect(res.status).toBe(409)
    expect(await json(res)).toEqual({ error: "email dipakai" })
  })

  it("409 jika update prisma gagal", async () => {
    mAuth.mockResolvedValue(authOk)
    m.findFirst.mockResolvedValue({ ...userRow, authUserId: "au1" })
    mAdmin.updateUserById.mockResolvedValue({ error: null })
    m.update.mockRejectedValue(new Error("duplicate"))
    const res = await PUT(putBody(), params("u1"))
    expect(res.status).toBe(409)
    expect(await json(res)).toEqual({ error: "email sudah dipakai user lain" })
  })
})

describe("DELETE /api/users/[id]", () => {
  it("soft delete + ban akun Supabase → 204", async () => {
    mAuth.mockResolvedValue(authOk)
    m.findFirst.mockResolvedValue({ ...userRow, authUserId: "au1" })
    mAdmin.updateUserById.mockResolvedValue({ error: null })
    const res = await DELETE(new Request("http://x"), params("u1"))
    expect(res.status).toBe(204)
    expect(mAdmin.updateUserById).toHaveBeenCalledWith("au1", { ban_duration: "876000h" })
    expect(m.update).toHaveBeenCalledWith({ where: { id: "u1" }, data: { deletedAt: expect.any(Date) } })
  })

  it("404 jika tidak ditemukan", async () => {
    mAuth.mockResolvedValue(authOk)
    m.findFirst.mockResolvedValue(null)
    expect((await DELETE(new Request("http://x"), params("u1"))).status).toBe(404)
  })
})
