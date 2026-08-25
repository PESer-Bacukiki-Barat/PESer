import { Prisma } from "@/generated/prisma/client"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { GET, POST } from "@/app/api/nasabah/route"
import { GET as GET_ID, PUT, DELETE } from "@/app/api/nasabah/[id]/route"

jest.mock("@/lib/auth", () => ({ requireAuth: jest.fn() }))
jest.mock("@/lib/prisma", () => {
  // Handler tulis kini menjalankan operasi + AuditLog dalam satu
  // $transaction (PRD §2.5 aturan 2). tx diarahkan ke objek mock yang
  // sama supaya assertion pada model tetap berlaku apa adanya.
  const m = {
    nasabah: {
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
const m = prisma.nasabah as unknown as ModelMock

const authOk = { ok: true, user: { id: "u1", role: "ADMIN", bankSampahId: null } }
const authPetugas = {
  ok: true,
  user: { id: "u2", role: "PETUGAS", bankSampahId: "bs-mawar" },
}
const unauthorized = { ok: false, response: Response.json({ error: "unauthorized" }, { status: 401 }) }
const prismaError = (code: string) =>
  new Prisma.PrismaClientKnownRequestError("boom", { code, clientVersion: "7.0.0" })
const params = (id: string) => ({ params: Promise.resolve({ id }) })
// PRD §2.5: respons dibungkus { success, data } untuk sukses dan
// { success, error: { code, message, field? } } untuk gagal.
const payload = async (res: Response) => (await res.json()).data
const apiErr = async (res: Response) => (await res.json()).error

const validBody = {
  kodeNasabah: "NS-001",
  bankSampahId: "b1",
  nama: "Budi",
  noHp: "0812345",
  alamat: "Jl. Melati",
  rt: "01",
  rw: "02",
}

const body = (over: object = {}) => new Request("http://x", { method: "POST", body: JSON.stringify({ ...validBody, ...over }) })

// jest.config.mjs memakai resetMocks: true, yang menghapus implementasi mock
// sebelum setiap test — termasuk $transaction. Jadi dipasang ulang di sini,
// bukan di factory jest.mock.
const mTx = prisma as unknown as { $transaction: jest.Mock }
beforeEach(() => {
  mTx.$transaction.mockImplementation((cb: (t: typeof prisma) => unknown) => cb(prisma))
  // Pemeriksaan kepemilikan sebelum UBAH/HAPUS: baris ada dan di dalam lingkup.
  m.findFirst.mockResolvedValue({ id: "n1", bankSampahId: "bs-mawar" })
})

describe("GET /api/nasabah", () => {
  it("mengembalikan daftar", async () => {
    mAuth.mockResolvedValue(authOk)
    m.findMany.mockResolvedValue([{ ...validBody, id: "n1" }])
    const res = await GET()
    expect(res.status).toBe(200)
    expect(await payload(res)).toEqual([{ ...validBody, id: "n1" }])
  })

  it("401 jika tidak login", async () => {
    mAuth.mockResolvedValue(unauthorized)
    expect((await GET()).status).toBe(401)
  })
})

describe("POST /api/nasabah", () => {
  it("membuat nasabah", async () => {
    mAuth.mockResolvedValue(authOk)
    m.create.mockResolvedValue({ ...validBody, id: "n1" })
    const res = await POST(body())
    expect(res.status).toBe(201)
    expect(await payload(res)).toEqual({ ...validBody, id: "n1" })
  })

  it("422 untuk body tidak valid", async () => {
    mAuth.mockResolvedValue(authOk)
    expect((await POST(body({ rt: "" }))).status).toBe(422)
    expect(m.create).not.toHaveBeenCalled()
  })

  it("409 jika kodeNasabah sudah dipakai (P2002)", async () => {
    mAuth.mockResolvedValue(authOk)
    m.create.mockRejectedValue(prismaError("P2002"))
    const res = await POST(body())
    expect(res.status).toBe(409)
    expect(await apiErr(res)).toMatchObject({ message: "kodeNasabah sudah dipakai" })
  })

  it("422 jika bankSampahId tidak ditemukan (P2003)", async () => {
    mAuth.mockResolvedValue(authOk)
    m.create.mockRejectedValue(prismaError("P2003"))
    const res = await POST(body())
    expect(res.status).toBe(422)
    expect(await apiErr(res)).toMatchObject({ message: "bankSampahId tidak ditemukan" })
  })

  it("400 untuk error lain", async () => {
    mAuth.mockResolvedValue(authOk)
    m.create.mockRejectedValue(new Error("x"))
    expect((await POST(body())).status).toBe(400)
  })
})

describe("GET /api/nasabah/[id]", () => {
  it("mengembalikan detail", async () => {
    mAuth.mockResolvedValue(authOk)
    m.findFirst.mockResolvedValue({ ...validBody, id: "n1" })
    expect((await GET_ID(new Request("http://x"), params("n1"))).status).toBe(200)
  })

  it("404 jika tidak ditemukan", async () => {
    mAuth.mockResolvedValue(authOk)
    m.findFirst.mockResolvedValue(null)
    expect((await GET_ID(new Request("http://x"), params("n1"))).status).toBe(404)
  })
})

describe("PUT /api/nasabah/[id]", () => {
  it("mengupdate", async () => {
    mAuth.mockResolvedValue(authOk)
    m.update.mockResolvedValue({ ...validBody, id: "n1" })
    const res = await PUT(body(), params("n1"))
    expect(res.status).toBe(200)
    expect(m.update).toHaveBeenCalledWith({ where: { id: "n1" }, data: { ...validBody, isActive: true } })
  })

  it("404 jika tidak ditemukan (P2025)", async () => {
    mAuth.mockResolvedValue(authOk)
    m.update.mockRejectedValue(prismaError("P2025"))
    expect((await PUT(body(), params("n1"))).status).toBe(404)
  })

  it("409 jika kodeNasabah sudah dipakai (P2002)", async () => {
    mAuth.mockResolvedValue(authOk)
    m.update.mockRejectedValue(prismaError("P2002"))
    expect((await PUT(body(), params("n1"))).status).toBe(409)
  })

  it("422 jika bankSampahId tidak ditemukan (P2003)", async () => {
    mAuth.mockResolvedValue(authOk)
    m.update.mockRejectedValue(prismaError("P2003"))
    expect((await PUT(body(), params("n1"))).status).toBe(422)
  })

  it("400 untuk error lain", async () => {
    mAuth.mockResolvedValue(authOk)
    m.update.mockRejectedValue(new Error("x"))
    expect((await PUT(body(), params("n1"))).status).toBe(400)
  })
})

describe("DELETE /api/nasabah/[id]", () => {
  it("soft delete → 204", async () => {
    mAuth.mockResolvedValue(authOk)
    // handler memakai hasil update untuk entitasId di AuditLog
    m.update.mockResolvedValue({ id: "n1" })
    expect((await DELETE(new Request("http://x"), params("n1"))).status).toBe(204)
    expect(m.update).toHaveBeenCalledWith({ where: { id: "n1" }, data: { deletedAt: expect.any(Date) } })
  })

  it("404 jika tidak ditemukan", async () => {
    mAuth.mockResolvedValue(authOk)
    m.update.mockRejectedValue(prismaError("P2025"))
    expect((await DELETE(new Request("http://x"), params("n1"))).status).toBe(404)
  })
})

/**
 * Lingkup bank sampah — PRD §2.4 baris 209 ("PETUGAS: bank sampah sendiri")
 * dan §2.5 aturan 4 ("scope tidak boleh diambil dari body request").
 *
 * Sebelumnya kelima handler mengabaikannya: GET mengembalikan nasabah SELURUH
 * bank sampah, dan POST/PUT memakai bankSampahId dari body — jadi petugas satu
 * pos bisa membaca nama, nomor HP, dan alamat warga pos lain, mengubahnya,
 * bahkan memindahkannya ke pos lain.
 */
describe("lingkup bank sampah", () => {
  it("GET petugas hanya bank sampahnya sendiri", async () => {
    mAuth.mockResolvedValue(authPetugas)
    m.findMany.mockResolvedValue([])
    await GET()
    expect(m.findMany.mock.calls[0][0].where).toEqual({
      deletedAt: null,
      bankSampahId: "bs-mawar",
    })
  })

  it("GET admin tidak dibatasi satu bank sampah (§5.3)", async () => {
    mAuth.mockResolvedValue(authOk)
    m.findMany.mockResolvedValue([])
    await GET()
    expect(m.findMany.mock.calls[0][0].where).toEqual({ deletedAt: null })
  })

  it("POST petugas MENGABAIKAN bankSampahId dari body", async () => {
    mAuth.mockResolvedValue(authPetugas)
    m.create.mockResolvedValue({ id: "n9" })
    const res = await POST(body({ bankSampahId: "bs-pos-lain" }))
    expect(res.status).toBe(201)
    expect(m.create.mock.calls[0][0].data.bankSampahId).toBe("bs-mawar")
  })

  it("POST admin wajib menyebut bankSampahId, tidak ditebak", async () => {
    mAuth.mockResolvedValue(authOk)
    const res = await POST(body({ bankSampahId: undefined }))
    expect(res.status).toBe(422)
    expect((await apiErr(res)).field).toBe("bankSampahId")
    expect(m.create).not.toHaveBeenCalled()
  })

  it("PUT petugas tidak bisa memindahkan nasabah ke bank sampah lain", async () => {
    mAuth.mockResolvedValue(authPetugas)
    m.update.mockResolvedValue({ id: "n1" })
    await PUT(body({ bankSampahId: "bs-pos-lain" }), params("n1"))
    expect(m.update.mock.calls[0][0].data.bankSampahId).toBe("bs-mawar")
  })

  it("PUT nasabah pos lain → 404, bukan 403 yang membocorkan keberadaannya", async () => {
    mAuth.mockResolvedValue(authPetugas)
    m.findFirst.mockResolvedValue(null) // di luar lingkup → tidak ditemukan
    const res = await PUT(body(), params("n-pos-lain"))
    expect(res.status).toBe(404)
    expect(m.update).not.toHaveBeenCalled()
  })

  it("DELETE nasabah pos lain → 404 dan tidak menyentuh apa pun", async () => {
    mAuth.mockResolvedValue(authPetugas)
    m.findFirst.mockResolvedValue(null)
    const res = await DELETE(new Request("http://x"), params("n-pos-lain"))
    expect(res.status).toBe(404)
    expect(m.update).not.toHaveBeenCalled()
  })

  it("GET by id menyertakan lingkup di where-nya", async () => {
    mAuth.mockResolvedValue(authPetugas)
    m.findFirst.mockResolvedValue({ id: "n1" })
    await GET_ID(new Request("http://x"), params("n1"))
    expect(m.findFirst.mock.calls[0][0].where).toEqual({
      id: "n1",
      deletedAt: null,
      bankSampahId: "bs-mawar",
    })
  })

  it("petugas tanpa penugasan ditolak saat menulis (BR-02)", async () => {
    mAuth.mockResolvedValue({
      ok: true,
      user: { id: "u3", role: "PETUGAS", bankSampahId: null },
    })
    const res = await POST(body())
    expect(res.status).toBe(403)
    expect(m.create).not.toHaveBeenCalled()
  })
})
