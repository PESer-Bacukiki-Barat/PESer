import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { requireAuth } from "@/lib/auth"
import { GET, POST } from "@/app/api/users/route"
import { GET as GET_ID, PUT, DELETE } from "@/app/api/users/[id]/route"

jest.mock("@/lib/auth", () => ({ requireAuth: jest.fn() }))
jest.mock("bcryptjs", () => ({ hash: jest.fn().mockResolvedValue("hashed") }))
jest.mock("@/lib/prisma", () => {
  // Handler tulis kini menjalankan operasi + AuditLog dalam satu
  // $transaction (PRD §2.5 aturan 2). tx diarahkan ke objek mock yang
  // sama supaya assertion pada model tetap berlaku apa adanya.
  const m = {
    user: {
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

// jest.config.mjs memakai resetMocks: true, yang menghapus implementasi mock
// sebelum setiap test — termasuk $transaction. Jadi dipasang ulang di sini,
// bukan di factory jest.mock.
const mTx = prisma as unknown as { $transaction: jest.Mock }
beforeEach(() => {
  mTx.$transaction.mockImplementation((cb: (t: typeof prisma) => unknown) => cb(prisma))
})

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

/**
 * noHp adalah jangkar penautan akun → Nasabah di area warga
 * (src/lib/nasabah-tertaut.ts). Pengisiannya kewenangan ADMIN, dan sengaja
 * TIDAK ada di PATCH /api/profil — kalau pemilik akun boleh mengubahnya
 * sendiri, ia bisa menuliskan nomor warga lain dan mengklaim riwayat
 * setorannya. Batasan itu dijaga di profil.test.ts.
 */
describe("noHp di /api/users", () => {
  it("POST menyimpan noHp apa adanya", async () => {
    mAuth.mockResolvedValue(authOk)
    m.create.mockResolvedValue({ ...userRow, bankSampah: null })
    await POST(body({ noHp: "081234500001" }))
    expect(m.create.mock.calls[0][0].data.noHp).toBe("081234500001")
  })

  it("POST menerima string kosong sebagai null, supaya form bisa mengosongkan", async () => {
    mAuth.mockResolvedValue(authOk)
    m.create.mockResolvedValue({ ...userRow, bankSampah: null })
    await POST(body({ noHp: "" }))
    expect(m.create.mock.calls[0][0].data.noHp).toBeNull()
  })

  it("POST 422 untuk nomor yang tidak bisa mengidentifikasi siapa pun", async () => {
    mAuth.mockResolvedValue(authOk)
    // Nomor "terisi tapi tidak pernah cocok" lebih membingungkan daripada kosong.
    expect((await POST(body({ noHp: "-" }))).status).toBe(422)
    expect((await POST(body({ noHp: "12345" }))).status).toBe(422)
    expect(m.create).not.toHaveBeenCalled()
  })

  it("PUT bisa mengisi maupun mengosongkan noHp", async () => {
    mAuth.mockResolvedValue(authOk)
    m.findFirst.mockResolvedValue({ id: "u1", email: "andi@mail.com" })
    m.update.mockResolvedValue(userRow)

    await PUT(putBody({ noHp: "+62 812-3450-0001" }), params("u1"))
    expect(m.update.mock.calls[0][0].data.noHp).toBe("+62 812-3450-0001")

    m.update.mockClear()
    await PUT(putBody({ noHp: null }), params("u1"))
    expect(m.update.mock.calls[0][0].data.noHp).toBeNull()
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
    // handler memakai hasil update untuk entitasId di AuditLog
    m.update.mockResolvedValue({ id: "u1" })
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