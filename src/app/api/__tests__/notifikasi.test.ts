/**
 * /api/notifikasi — FR-E5.
 *
 * Yang dijaga di sini: cakupan selalu datang dari sesi. Notifikasi adalah data
 * pribadi per akun, jadi tidak boleh ada jalan — lewat query maupun body —
 * untuk membaca atau menandai milik orang lain (§2.5 aturan 4).
 */
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { GET } from "@/app/api/notifikasi/route"
import { POST } from "@/app/api/notifikasi/baca/route"
import { BATAS_NOTIFIKASI } from "@/lib/constants"

jest.mock("@/lib/auth", () => ({ requireAuth: jest.fn() }))
jest.mock("@/lib/prisma", () => ({
  prisma: {
    notifikasi: { findMany: jest.fn(), count: jest.fn(), updateMany: jest.fn() },
  },
}))

const mAuth = requireAuth as jest.Mock
const m = prisma.notifikasi as unknown as {
  findMany: jest.Mock
  count: jest.Mock
  updateMany: jest.Mock
}

const authOk = { ok: true, user: { id: "u1", role: "ADMIN", bankSampahId: null } }
const unauthorized = {
  ok: false,
  response: Response.json({ error: "unauthorized" }, { status: 401 }),
}

const get = (qs = "") => new Request(`http://x/api/notifikasi${qs}`)
const post = (body: unknown) =>
  new Request("http://x/api/notifikasi/baca", {
    method: "POST",
    body: JSON.stringify(body),
  })

const payload = async (res: Response) => (await res.json()).data

beforeEach(() => {
  jest.clearAllMocks()
  m.findMany.mockResolvedValue([])
  m.count.mockResolvedValue(0)
  m.updateMany.mockResolvedValue({ count: 0 })
})

describe("GET /api/notifikasi", () => {
  it("401 kalau tidak login", async () => {
    mAuth.mockResolvedValue(unauthorized)
    expect((await GET(get())).status).toBe(401)
    expect(m.findMany).not.toHaveBeenCalled()
  })

  it("cukup login — kedua peran punya notifikasi (FR-E5)", async () => {
    mAuth.mockResolvedValue(authOk)
    expect((await GET(get())).status).toBe(200)
    expect(mAuth).toHaveBeenCalledWith()
  })

  it("hanya membaca milik akun di sesi", async () => {
    mAuth.mockResolvedValue(authOk)
    await GET(get())
    expect(m.findMany.mock.calls[0][0].where).toEqual({
      userId: "u1",
      deletedAt: null,
    })
  })

  it("query tidak bisa menukar pemilik", async () => {
    mAuth.mockResolvedValue(authOk)
    await GET(get("?userId=u2"))
    expect(m.findMany.mock.calls[0][0].where.userId).toBe("u1")
  })

  it("belumDibaca=true menyaring yang belum dibaca saja", async () => {
    mAuth.mockResolvedValue(authOk)
    await GET(get("?belumDibaca=true"))
    expect(m.findMany.mock.calls[0][0].where).toMatchObject({ dibacaPada: null })
  })

  it("jumlah belum dibaca dihitung terpisah, bukan dari panjang daftar", async () => {
    // Kalau dihitung dari daftar, badge berhenti di BATAS_NOTIFIKASI dan
    // menyembunyikan sisanya.
    mAuth.mockResolvedValue(authOk)
    m.findMany.mockResolvedValue([{ id: "n1" }])
    m.count.mockResolvedValue(37)
    expect((await payload(await GET(get()))).belumDibaca).toBe(37)
    expect(m.count.mock.calls[0][0].where).toEqual({
      userId: "u1",
      deletedAt: null,
      dibacaPada: null,
    })
  })

  it("batas bawaan dipakai kalau query tidak menyebutkannya", async () => {
    mAuth.mockResolvedValue(authOk)
    await GET(get())
    expect(m.findMany.mock.calls[0][0].take).toBe(BATAS_NOTIFIKASI)
  })

  it("422 untuk batas di luar rentang", async () => {
    mAuth.mockResolvedValue(authOk)
    expect((await GET(get("?batas=0"))).status).toBe(422)
    expect((await GET(get(`?batas=${BATAS_NOTIFIKASI + 1}`))).status).toBe(422)
    expect(m.findMany).not.toHaveBeenCalled()
  })
})

describe("POST /api/notifikasi/baca", () => {
  it("401 kalau tidak login", async () => {
    mAuth.mockResolvedValue(unauthorized)
    expect((await POST(post({}))).status).toBe(401)
    expect(m.updateMany).not.toHaveBeenCalled()
  })

  it("tanpa id menandai semua milik sendiri", async () => {
    mAuth.mockResolvedValue(authOk)
    const res = await POST(post({}))
    expect(res.status).toBe(200)
    expect(m.updateMany.mock.calls[0][0].where).toEqual({
      userId: "u1",
      deletedAt: null,
      dibacaPada: null,
    })
  })

  it("dengan id, filter userId TETAP ikut", async () => {
    // Inilah yang membuat id milik orang lain tidak cocok dengan apa pun.
    mAuth.mockResolvedValue(authOk)
    await POST(post({ id: "n-orang-lain" }))
    expect(m.updateMany.mock.calls[0][0].where).toEqual({
      userId: "u1",
      deletedAt: null,
      dibacaPada: null,
      id: "n-orang-lain",
    })
  })

  it("id milik orang lain menghasilkan 0, bukan 403 yang membocorkan keberadaannya", async () => {
    mAuth.mockResolvedValue(authOk)
    m.updateMany.mockResolvedValue({ count: 0 })
    const res = await POST(post({ id: "n-orang-lain" }))
    expect(res.status).toBe(200)
    expect(await payload(res)).toEqual({ ditandai: 0 })
  })

  it("body kosong atau bukan JSON tetap sah — artinya 'tandai semua'", async () => {
    mAuth.mockResolvedValue(authOk)
    const res = await POST(
      new Request("http://x/api/notifikasi/baca", { method: "POST", body: "bukan json" }),
    )
    expect(res.status).toBe(200)
  })

  it("422 kalau id dikirim tapi kosong", async () => {
    mAuth.mockResolvedValue(authOk)
    expect((await POST(post({ id: "" }))).status).toBe(422)
    expect(m.updateMany).not.toHaveBeenCalled()
  })
})
