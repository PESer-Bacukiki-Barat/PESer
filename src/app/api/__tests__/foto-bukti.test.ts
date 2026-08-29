/**
 * Foto bukti serah terima — FR-D5, BR-19.
 *
 * Yang dijaga di sini adalah hal yang tidak terlihat dari status HTTP: siapa
 * boleh melihat dan mengubah (foto dispatch memuat lokasi dan orang, jadi ia
 * bukan aset publik), batas ukuran dihitung dari isi yang BENAR-BENAR diterima
 * bukan dari header yang bisa berbohong, dan fotonya terkunci begitu dispatch
 * final (BR-13).
 */
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { GET, POST, DELETE } from "@/app/api/dispatch/[id]/foto/route"
import { MAKS_UKURAN_FOTO_BYTE } from "@/lib/constants"

jest.mock("@/lib/auth", () => ({ requireAuth: jest.fn() }))
jest.mock("@/lib/prisma", () => {
  const m = {
    dispatch: { findFirst: jest.fn(), update: jest.fn() },
    fotoBukti: { findUnique: jest.fn(), upsert: jest.fn(), delete: jest.fn() },
    auditLog: { create: jest.fn() },
    $transaction: jest.fn(),
  }
  return { prisma: m }
})

const mAuth = requireAuth as jest.Mock
const m = prisma as unknown as {
  dispatch: { findFirst: jest.Mock; update: jest.Mock }
  fotoBukti: { findUnique: jest.Mock; upsert: jest.Mock; delete: jest.Mock }
  auditLog: { create: jest.Mock }
  $transaction: jest.Mock
}

const BS = "bs-mawar"
const pemilik = {
  ok: true,
  user: { id: "u-p1", role: "PETUGAS", bankSampahId: BS },
}
const petugasLain = {
  ok: true,
  user: { id: "u-p2", role: "PETUGAS", bankSampahId: "bs-melati" },
}
const admin = { ok: true, user: { id: "u-a", role: "ADMIN", bankSampahId: null } }
const unauthorized = {
  ok: false,
  response: Response.json({ success: false }, { status: 401 }),
}

const ctx = { params: Promise.resolve({ id: "d1" }) }
const dispatchDengan = (status: string) => ({
  id: "d1",
  kodeDispatch: "DSP-1",
  status,
  bankSampahId: BS,
})

const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10])

function unggah(isi: Buffer, tipe = "image/jpeg") {
  return new Request("http://x/api/dispatch/d1/foto", {
    method: "POST",
    body: new Uint8Array(isi),
    headers: { "content-type": tipe },
  })
}

const apiErr = async (res: Response) => (await res.json()).error

beforeEach(() => {
  jest.clearAllMocks()
  m.dispatch.findFirst.mockResolvedValue(dispatchDengan("DITERIMA"))
  m.dispatch.update.mockResolvedValue({ id: "d1" })
  m.fotoBukti.upsert.mockResolvedValue({
    id: "f1",
    ukuran: JPEG.byteLength,
    mimeType: "image/jpeg",
    createdAt: new Date("2026-08-29T00:00:00Z"),
  })
  m.fotoBukti.delete.mockResolvedValue({ id: "f1" })
  m.auditLog.create.mockResolvedValue({})
  m.$transaction.mockImplementation((cb: (t: typeof prisma) => unknown) => cb(prisma))
})

describe("GET /api/dispatch/[id]/foto", () => {
  it("401 kalau tidak login", async () => {
    mAuth.mockResolvedValue(unauthorized)
    expect((await GET(new Request("http://x"), ctx)).status).toBe(401)
  })

  it("404 kalau dispatch tidak ada", async () => {
    mAuth.mockResolvedValue(pemilik)
    m.dispatch.findFirst.mockResolvedValue(null)
    expect((await GET(new Request("http://x"), ctx)).status).toBe(404)
  })

  it("petugas bank sampah LAIN ditolak — foto memuat lokasi dan orang", async () => {
    mAuth.mockResolvedValue(petugasLain)
    const res = await GET(new Request("http://x"), ctx)
    expect(res.status).toBe(403)
    expect(m.fotoBukti.findUnique).not.toHaveBeenCalled()
  })

  it("admin boleh melihat — ia yang memverifikasi sebelum menutup (FR-D6)", async () => {
    mAuth.mockResolvedValue(admin)
    m.fotoBukti.findUnique.mockResolvedValue({
      data: JPEG,
      mimeType: "image/jpeg",
      ukuran: JPEG.byteLength,
      createdAt: new Date("2026-08-29T00:00:00Z"),
    })
    const res = await GET(new Request("http://x"), ctx)
    expect(res.status).toBe(200)
    expect(res.headers.get("Content-Type")).toBe("image/jpeg")
  })

  it("menyajikan biner dengan header yang benar, bukan amplop JSON", async () => {
    mAuth.mockResolvedValue(pemilik)
    m.fotoBukti.findUnique.mockResolvedValue({
      data: JPEG,
      mimeType: "image/jpeg",
      ukuran: JPEG.byteLength,
      createdAt: new Date("2026-08-29T00:00:00Z"),
    })
    const res = await GET(new Request("http://x"), ctx)

    expect(res.headers.get("Content-Length")).toBe(String(JPEG.byteLength))
    // Foto milik satu bank sampah — tidak boleh nyangkut di cache bersama.
    expect(res.headers.get("Cache-Control")).toContain("private")
    // Mencegah browser menebak tipe lain dari isinya.
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff")
    expect(Buffer.from(await res.arrayBuffer())).toEqual(JPEG)
  })

  it("404 kalau dispatch-nya ada tapi belum punya foto", async () => {
    mAuth.mockResolvedValue(pemilik)
    m.fotoBukti.findUnique.mockResolvedValue(null)
    expect((await GET(new Request("http://x"), ctx)).status).toBe(404)
  })
})

describe("POST /api/dispatch/[id]/foto", () => {
  it("hanya PETUGAS pemilik — admin tidak berada di lokasi", async () => {
    mAuth.mockResolvedValue(admin)
    const res = await POST(unggah(JPEG), ctx)
    expect(res.status).toBe(403)
    expect(m.fotoBukti.upsert).not.toHaveBeenCalled()
  })

  it("petugas bank sampah lain ditolak", async () => {
    mAuth.mockResolvedValue(petugasLain)
    expect((await POST(unggah(JPEG), ctx)).status).toBe(403)
  })

  it.each(["DITERIMA", "SERAH_TERIMA"])("status %s boleh menerima foto", async (st) => {
    mAuth.mockResolvedValue(pemilik)
    m.dispatch.findFirst.mockResolvedValue(dispatchDengan(st))
    expect((await POST(unggah(JPEG), ctx)).status).toBe(201)
  })

  it.each(["DRAFT", "DISPATCHED", "DITOLAK", "SELESAI", "DIBATALKAN"])(
    "status %s ditolak",
    async (st) => {
      // SELESAI terkunci mengikuti BR-13; sisanya belum ada yang bisa dipotret.
      mAuth.mockResolvedValue(pemilik)
      m.dispatch.findFirst.mockResolvedValue(dispatchDengan(st))
      const res = await POST(unggah(JPEG), ctx)
      expect(res.status).toBe(409)
      expect(m.fotoBukti.upsert).not.toHaveBeenCalled()
    },
  )

  it("menolak tipe berkas yang bukan gambar", async () => {
    mAuth.mockResolvedValue(pemilik)
    const res = await POST(unggah(JPEG, "application/pdf"), ctx)
    expect(res.status).toBe(422)
    expect((await apiErr(res)).field).toBe("Content-Type")
  })

  it("menolak berkas kosong", async () => {
    mAuth.mockResolvedValue(pemilik)
    expect((await POST(unggah(Buffer.alloc(0)), ctx)).status).toBe(422)
  })

  it("batas ukuran dihitung dari isi yang diterima, bukan header", async () => {
    // Content-Length bisa berbohong; yang menentukan adalah byte yang sungguh
    // sampai ke server.
    mAuth.mockResolvedValue(pemilik)
    const res = await POST(unggah(Buffer.alloc(MAKS_UKURAN_FOTO_BYTE + 1, 1)), ctx)
    expect(res.status).toBe(422)
    expect(m.fotoBukti.upsert).not.toHaveBeenCalled()
  })

  it("tepat di batas diterima", async () => {
    mAuth.mockResolvedValue(pemilik)
    expect(
      (await POST(unggah(Buffer.alloc(MAKS_UKURAN_FOTO_BYTE, 1)), ctx)).status,
    ).toBe(201)
  })

  it("menulis foto, fotoBuktiUrl, dan AuditLog dalam SATU transaksi", async () => {
    mAuth.mockResolvedValue(pemilik)
    const res = await POST(unggah(JPEG), ctx)

    expect(res.status).toBe(201)
    expect(m.$transaction).toHaveBeenCalledTimes(1)
    expect(m.fotoBukti.upsert).toHaveBeenCalledTimes(1)
    // Kolom penanda ditulis bersamaan — kalau tidak, ia bisa menunjuk foto
    // yang gagal tersimpan.
    expect(m.dispatch.update.mock.calls[0][0].data.fotoBuktiUrl).toBe(
      "/api/dispatch/d1/foto",
    )
    expect(m.auditLog.create).toHaveBeenCalledTimes(1)
  })

  it("AuditLog tidak memuat isi berkasnya", async () => {
    // Satu megabyte biner di dalam audit log membuat jejaknya tak terbaca.
    mAuth.mockResolvedValue(pemilik)
    await POST(unggah(JPEG), ctx)
    const payload = JSON.stringify(m.auditLog.create.mock.calls[0][0].data)
    expect(payload).not.toContain("data")
    expect(payload).toContain("ukuran")
  })

  it("unggah ulang mengganti, bukan menumpuk (satu foto per dispatch)", async () => {
    mAuth.mockResolvedValue(pemilik)
    await POST(unggah(JPEG), ctx)
    expect(m.fotoBukti.upsert.mock.calls[0][0].where).toEqual({ dispatchId: "d1" })
  })
})

describe("DELETE /api/dispatch/[id]/foto", () => {
  it("hanya petugas pemilik", async () => {
    mAuth.mockResolvedValue(petugasLain)
    expect((await DELETE(new Request("http://x"), ctx)).status).toBe(403)
  })

  it("404 kalau memang belum ada fotonya", async () => {
    mAuth.mockResolvedValue(pemilik)
    m.fotoBukti.findUnique.mockResolvedValue(null)
    expect((await DELETE(new Request("http://x"), ctx)).status).toBe(404)
  })

  it("menghapus foto, mengosongkan penanda, dan menulis audit", async () => {
    mAuth.mockResolvedValue(pemilik)
    m.fotoBukti.findUnique.mockResolvedValue({ id: "f1" })
    const res = await DELETE(new Request("http://x"), ctx)

    expect(res.status).toBe(204)
    expect(m.fotoBukti.delete).toHaveBeenCalledWith({ where: { dispatchId: "d1" } })
    expect(m.dispatch.update.mock.calls[0][0].data.fotoBuktiUrl).toBeNull()
    expect(m.auditLog.create).toHaveBeenCalledTimes(1)
  })

  it("dispatch final terkunci (BR-13)", async () => {
    mAuth.mockResolvedValue(pemilik)
    m.dispatch.findFirst.mockResolvedValue(dispatchDengan("SELESAI"))
    const res = await DELETE(new Request("http://x"), ctx)
    expect(res.status).toBe(409)
    expect(m.fotoBukti.delete).not.toHaveBeenCalled()
  })
})
