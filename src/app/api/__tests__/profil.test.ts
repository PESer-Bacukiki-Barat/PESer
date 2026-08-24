/**
 * PATCH /api/profil — FR-A2 "Ubah profil & password sendiri".
 *
 * Yang dijaga di sini adalah properti keamanan yang tidak terlihat dari status
 * HTTP: password lama benar-benar diverifikasi ulang meski sesi valid, field
 * kewenangan admin (role/bankSampahId/isActive) tidak bisa diselipkan lewat
 * body, dan password gagal tidak menyentuh kredensial.
 */
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { GET, PATCH } from "@/app/api/profil/route"

jest.mock("@/lib/auth", () => ({ requireAuth: jest.fn() }))
jest.mock("bcryptjs", () => ({ compare: jest.fn(), hash: jest.fn() }))
jest.mock("@/lib/prisma", () => {
  const m = {
    user: { findUnique: jest.fn(), update: jest.fn() },
    credential: { findUnique: jest.fn(), update: jest.fn() },
    auditLog: { create: jest.fn() },
    $transaction: jest.fn(),
  }
  return { prisma: m }
})

const mAuth = requireAuth as jest.Mock
const mBcrypt = bcrypt as unknown as { compare: jest.Mock; hash: jest.Mock }
const m = prisma as unknown as {
  user: { findUnique: jest.Mock; update: jest.Mock }
  credential: { findUnique: jest.Mock; update: jest.Mock }
  auditLog: { create: jest.Mock }
  $transaction: jest.Mock
}

const AKU = { id: "u1", nama: "Andi", email: "andi@peser.local", role: "PETUGAS" }
const authOk = { ok: true, user: AKU }
const unauthorized = {
  ok: false,
  response: Response.json({ success: false }, { status: 401 }),
}

const patch = (body: unknown) =>
  new Request("http://x/api/profil", { method: "PATCH", body: JSON.stringify(body) })

beforeEach(() => {
  mAuth.mockResolvedValue(authOk)
  m.$transaction.mockImplementation((cb: (t: typeof prisma) => unknown) => cb(prisma))
  m.user.update.mockResolvedValue({ id: "u1", nama: "Andi", email: AKU.email })
  m.credential.update.mockResolvedValue({ id: "c1" })
  m.credential.findUnique.mockResolvedValue({
    id: "c1",
    passwordHash: "$2a$10$lama",
    deletedAt: null,
  })
  mBcrypt.hash.mockResolvedValue("$2a$10$baru")
})

describe("GET /api/profil", () => {
  it("mengembalikan profil sendiri tanpa apa pun dari Credential", async () => {
    m.user.findUnique.mockResolvedValue({ id: "u1", nama: "Andi", email: AKU.email })
    const res = await GET()
    expect(res.status).toBe(200)
    const dipilih = m.user.findUnique.mock.calls[0][0].select
    expect(dipilih).not.toHaveProperty("credential")
    expect(dipilih).not.toHaveProperty("passwordHash")
  })

  it("401 kalau tidak login", async () => {
    mAuth.mockResolvedValue(unauthorized)
    expect((await GET()).status).toBe(401)
  })
})

describe("PATCH /api/profil — guard", () => {
  it("cukup login, tidak menuntut peran tertentu", async () => {
    await PATCH(patch({ nama: "Andi Baru" }))
    expect(mAuth).toHaveBeenCalledWith()
  })

  it("401 kalau tidak login", async () => {
    mAuth.mockResolvedValue(unauthorized)
    const res = await PATCH(patch({ nama: "X" }))
    expect(res.status).toBe(401)
    expect(m.$transaction).not.toHaveBeenCalled()
  })
})

describe("PATCH /api/profil — validasi", () => {
  it("422 kalau tidak ada yang diubah", async () => {
    const res = await PATCH(patch({}))
    expect(res.status).toBe(422)
    expect(m.$transaction).not.toHaveBeenCalled()
  })

  it("422 kalau password baru diisi tanpa password lama", async () => {
    const res = await PATCH(patch({ passwordBaru: "rahasia123" }))
    expect(res.status).toBe(422)
    expect((await res.json()).error.field).toBe("passwordLama")
  })

  it("422 kalau password lama diisi tanpa password baru", async () => {
    const res = await PATCH(patch({ passwordLama: "lama123" }))
    expect(res.status).toBe(422)
  })

  it("422 kalau password baru sama dengan yang lama", async () => {
    const res = await PATCH(patch({ passwordLama: "sama123", passwordBaru: "sama123" }))
    expect(res.status).toBe(422)
    expect((await res.json()).error.field).toBe("passwordBaru")
    expect(mBcrypt.compare).not.toHaveBeenCalled()
  })

  it("422 kalau password baru kurang dari 6 karakter", async () => {
    const res = await PATCH(patch({ passwordLama: "lama123", passwordBaru: "abc" }))
    expect(res.status).toBe(422)
  })
})

describe("PATCH /api/profil — verifikasi password lama", () => {
  it("menolak kalau password lama salah, dan TIDAK menyentuh kredensial", async () => {
    mBcrypt.compare.mockResolvedValue(false)
    const res = await PATCH(patch({ passwordLama: "salah", passwordBaru: "barubaru1" }))
    expect(res.status).toBe(422)
    const body = await res.json()
    expect(body.error.field).toBe("passwordLama")
    expect(m.credential.update).not.toHaveBeenCalled()
    expect(m.$transaction).not.toHaveBeenCalled()
  })

  it("membandingkan password lama dengan hash tersimpan", async () => {
    mBcrypt.compare.mockResolvedValue(true)
    await PATCH(patch({ passwordLama: "lama123", passwordBaru: "barubaru1" }))
    expect(mBcrypt.compare).toHaveBeenCalledWith("lama123", "$2a$10$lama")
  })

  it("404 kalau kredensial sudah soft delete", async () => {
    m.credential.findUnique.mockResolvedValue({
      id: "c1",
      passwordHash: "$2a$10$lama",
      deletedAt: new Date(),
    })
    const res = await PATCH(patch({ passwordLama: "lama123", passwordBaru: "barubaru1" }))
    expect(res.status).toBe(404)
  })
})

describe("PATCH /api/profil — penyimpanan", () => {
  it("mengganti password dengan hash baru dan menandai lewat header", async () => {
    mBcrypt.compare.mockResolvedValue(true)
    const res = await PATCH(patch({ passwordLama: "lama123", passwordBaru: "barubaru1" }))
    expect(res.status).toBe(200)
    expect(mBcrypt.hash).toHaveBeenCalledWith("barubaru1", 10)
    expect(m.credential.update).toHaveBeenCalledWith({
      where: { userId: "u1" },
      data: { passwordHash: "$2a$10$baru" },
    })
    // Sesi lain tidak bisa dicabut (JWT tanpa penyimpanan server), jadi
    // pengguna harus diberi tahu, bukan dibiarkan menyangka aman.
    expect(res.headers.get("Password-Changed")).toBe("true")
  })

  it("ubah nama saja tidak menyentuh kredensial", async () => {
    const res = await PATCH(patch({ nama: "Andi Baru" }))
    expect(res.status).toBe(200)
    expect(m.credential.update).not.toHaveBeenCalled()
    expect(mBcrypt.compare).not.toHaveBeenCalled()
    expect(m.user.update.mock.calls[0][0].data).toEqual({ nama: "Andi Baru" })
    expect(res.headers.get("Password-Changed")).toBeNull()
  })

  it("field kewenangan admin di body diabaikan", async () => {
    const res = await PATCH(
      patch({
        nama: "Andi Baru",
        role: "ADMIN",
        bankSampahId: "bs-lain",
        isActive: false,
        email: "curang@peser.local",
      }),
    )
    expect(res.status).toBe(200)
    const data = m.user.update.mock.calls[0][0].data
    expect(data).toEqual({ nama: "Andi Baru" })
    expect(data).not.toHaveProperty("role")
    expect(data).not.toHaveProperty("bankSampahId")
    expect(data).not.toHaveProperty("isActive")
    expect(data).not.toHaveProperty("email")
  })

  it("hanya mengubah dirinya sendiri, id diambil dari sesi", async () => {
    await PATCH(patch({ nama: "Andi Baru" }))
    expect(m.user.update.mock.calls[0][0].where).toEqual({ id: "u1" })
  })

  it("menulis AuditLog dalam transaksi yang sama", async () => {
    mBcrypt.compare.mockResolvedValue(true)
    await PATCH(patch({ passwordLama: "lama123", passwordBaru: "barubaru1" }))
    expect(m.$transaction).toHaveBeenCalledTimes(1)
    expect(m.auditLog.create).toHaveBeenCalledTimes(1)
    const log = m.auditLog.create.mock.calls[0][0].data
    expect(log.aksi).toBe("UBAH_USER")
    expect(log.entitasId).toBe("u1")
  })
})
