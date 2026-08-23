/**
 * POST/GET /api/setoran — inti Modul C.
 *
 * Yang dijaga di sini adalah hal-hal yang tidak terlihat dari status HTTP:
 * harga di-snapshot dari master (BR-09), stock hanya berubah bersama
 * StockMutation (larangan §8.7), AuditLog ikut dalam transaksi yang sama
 * (§2.5 aturan 2), scope diambil dari sesi (§2.5 aturan 4), dan replay
 * Idempotency-Key tidak membuat transaksi kedua.
 */
import { Prisma } from "@/generated/prisma/client"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { GET, POST } from "@/app/api/setoran/route"

jest.mock("@/lib/auth", () => ({ requireAuth: jest.fn() }))
jest.mock("@/lib/prisma", () => ({
  prisma: {
    setoran: { findUnique: jest.fn(), findMany: jest.fn() },
    nasabah: { findFirst: jest.fn() },
    jenisSampah: { findMany: jest.fn() },
    $transaction: jest.fn(),
  },
}))

const mAuth = requireAuth as jest.Mock
const mPrisma = prisma as unknown as {
  setoran: { findUnique: jest.Mock; findMany: jest.Mock }
  nasabah: { findFirst: jest.Mock }
  jenisSampah: { findMany: jest.Mock }
  $transaction: jest.Mock
}

const petugas = {
  ok: true,
  user: { id: "u-petugas", role: "PETUGAS", bankSampahId: "bs-mawar" },
}
const adminUser = { ok: true, user: { id: "u-admin", role: "ADMIN", bankSampahId: null } }
const forbidden = {
  ok: false,
  response: Response.json({ success: false, error: { code: "AKSES_DITOLAK" } }, { status: 403 }),
}

const JENIS_PET = { id: "j-pet", nama: "Botol PET", harga: new Prisma.Decimal(3000) }
const JENIS_KARDUS = { id: "j-kardus", nama: "Kardus", harga: new Prisma.Decimal(1800) }

const validBody = {
  nasabahId: "n1",
  items: [
    { jenisSampahId: "j-pet", berat: 12.5, kondisi: "BERSIH" },
    { jenisSampahId: "j-kardus", berat: 8, kondisi: "CAMPUR" },
  ],
}

function post(body: unknown, key: string | null = "kunci-1"): Request {
  return new Request("http://x/api/setoran", {
    method: "POST",
    body: JSON.stringify(body),
    headers: key ? { "Idempotency-Key": key } : {},
  })
}

/** Mock transaksi: mengumpulkan panggilan tx supaya bisa diperiksa. */
function mockTransaction() {
  const tx = {
    setoran: {
      count: jest.fn().mockResolvedValue(2),
      create: jest.fn().mockImplementation(({ data }) =>
        Promise.resolve({ id: "set1", kodeTransaksi: data.kodeTransaksi, ...data }),
      ),
    },
    stock: {
      findUnique: jest.fn().mockResolvedValue({ id: "st1", berat: new Prisma.Decimal(65) }),
      update: jest.fn().mockResolvedValue({ id: "st1" }),
      create: jest.fn().mockResolvedValue({ id: "st-baru" }),
    },
    stockMutation: { create: jest.fn().mockResolvedValue({}) },
    auditLog: { create: jest.fn().mockResolvedValue({}) },
  }
  mPrisma.$transaction.mockImplementation((cb: (t: typeof tx) => unknown) => cb(tx))
  return tx
}

beforeEach(() => {
  jest.clearAllMocks()
  mAuth.mockResolvedValue(petugas)
  mPrisma.setoran.findUnique.mockResolvedValue(null)
  mPrisma.nasabah.findFirst.mockResolvedValue({ id: "n1" })
  mPrisma.jenisSampah.findMany.mockResolvedValue([JENIS_PET, JENIS_KARDUS])
})

describe("POST /api/setoran — guard", () => {
  it("hanya untuk PETUGAS (FR-C1)", async () => {
    mAuth.mockResolvedValue(forbidden)
    const res = await POST(post(validBody))
    expect(mAuth).toHaveBeenCalledWith("PETUGAS")
    expect(res.status).toBe(403)
    expect(mPrisma.$transaction).not.toHaveBeenCalled()
  })

  it("403 kalau petugas belum ditugaskan ke bank sampah", async () => {
    mAuth.mockResolvedValue({ ok: true, user: { id: "u", role: "PETUGAS", bankSampahId: null } })
    const res = await POST(post(validBody))
    expect(res.status).toBe(403)
  })

  it("422 kalau header Idempotency-Key tidak ada", async () => {
    const res = await POST(post(validBody, null))
    const body = await res.json()
    expect(res.status).toBe(422)
    expect(body.error.field).toBe("Idempotency-Key")
    expect(mPrisma.$transaction).not.toHaveBeenCalled()
  })

  it("422 untuk body tidak valid", async () => {
    const res = await POST(post({ nasabahId: "n1", items: [] }))
    expect(res.status).toBe(422)
    expect((await res.json()).error.code).toBe("VALIDASI_GAGAL")
  })
})

describe("POST /api/setoran — validasi domain", () => {
  it("404 kalau nasabah bukan milik bank sampah petugas", async () => {
    mPrisma.nasabah.findFirst.mockResolvedValue(null)
    const res = await POST(post(validBody))
    expect(res.status).toBe(404)
    // scope dipakai di query, bukan diambil dari body
    expect(mPrisma.nasabah.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ bankSampahId: "bs-mawar" }),
      }),
    )
  })

  it("404 kalau ada jenis sampah tidak dikenal", async () => {
    mPrisma.jenisSampah.findMany.mockResolvedValue([JENIS_PET])
    const res = await POST(post(validBody))
    expect(res.status).toBe(404)
  })

  it("HARGA_TIDAK_AKTIF kalau harga 0 (BR-16)", async () => {
    mPrisma.jenisSampah.findMany.mockResolvedValue([
      JENIS_PET,
      { id: "j-kardus", nama: "Kardus", harga: new Prisma.Decimal(0) },
    ])
    const res = await POST(post(validBody))
    expect(res.status).toBe(422)
    expect((await res.json()).error.code).toBe("HARGA_TIDAK_AKTIF")
    expect(mPrisma.$transaction).not.toHaveBeenCalled()
  })
})

describe("POST /api/setoran — idempotensi", () => {
  it("replay mengembalikan hasil lama tanpa transaksi baru", async () => {
    mPrisma.setoran.findUnique.mockResolvedValue({ id: "set-lama", kodeTransaksi: "SET-1" })
    const res = await POST(post(validBody))
    expect(res.status).toBe(200)
    expect(res.headers.get("Idempotent-Replay")).toBe("true")
    expect((await res.json()).data.kodeTransaksi).toBe("SET-1")
    expect(mPrisma.$transaction).not.toHaveBeenCalled()
  })

  it("mencari replay berdasarkan idempotencyKey dari header", async () => {
    mockTransaction()
    await POST(post(validBody, "kunci-xyz"))
    expect(mPrisma.setoran.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { idempotencyKey: "kunci-xyz" } }),
    )
  })
})

describe("POST /api/setoran — transaksi atomik (§6.1)", () => {
  it("menyimpan setoran dengan harga snapshot dan subtotal terhitung", async () => {
    const tx = mockTransaction()
    const res = await POST(post(validBody))
    expect(res.status).toBe(201)

    const data = tx.setoran.create.mock.calls[0][0].data
    // BR-09: harga diambil dari master, bukan dari body
    expect(data.items.create[0].hargaSaatItu).toEqual(JENIS_PET.harga)
    // 12.5 x 3000 = 37500 dan 8 x 1800 = 14400
    expect(data.items.create[0].subtotal.toString()).toBe("37500")
    expect(data.items.create[1].subtotal.toString()).toBe("14400")
    expect(data.totalBerat.toString()).toBe("20.5")
    expect(data.totalNilai.toString()).toBe("51900")
  })

  it("scope dan petugas diambil dari sesi, bukan dari body", async () => {
    const tx = mockTransaction()
    await POST(post({ ...validBody, bankSampahId: "bs-palsu", petugasId: "u-palsu" }))
    const data = tx.setoran.create.mock.calls[0][0].data
    expect(data.bankSampahId).toBe("bs-mawar")
    expect(data.petugasId).toBe("u-petugas")
  })

  it("kodeTransaksi memakai nomor urut global per bulan", async () => {
    const tx = mockTransaction()
    await POST(post(validBody))
    // count di-mock 2, jadi nomor berikutnya 003
    expect(tx.setoran.count).toHaveBeenCalledWith({
      where: { kodeTransaksi: { startsWith: expect.stringMatching(/^SET-\d{6}-$/) } },
    })
    expect(tx.setoran.create.mock.calls[0][0].data.kodeTransaksi).toMatch(/^SET-\d{6}-003$/)
  })

  it("menaikkan stock dan menulis StockMutation MASUK per item", async () => {
    const tx = mockTransaction()
    await POST(post(validBody))

    // stock lama 65 + 12.5 = 77.5
    expect(tx.stock.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { berat: expect.anything() } }),
    )
    expect(tx.stock.update.mock.calls[0][0].data.berat.toString()).toBe("77.5")

    expect(tx.stockMutation.create).toHaveBeenCalledTimes(2)
    const mutasi = tx.stockMutation.create.mock.calls[0][0].data
    expect(mutasi.tipe).toBe("MASUK")
    expect(mutasi.refType).toBe("SETORAN")
    expect(mutasi.beratSebelum.toString()).toBe("65")
    expect(mutasi.beratSesudah.toString()).toBe("77.5")
    expect(mutasi.userId).toBe("u-petugas")
  })

  it("membuat baris stock baru kalau jenis itu belum pernah ada", async () => {
    const tx = mockTransaction()
    tx.stock.findUnique.mockResolvedValue(null)
    await POST(post(validBody))
    expect(tx.stock.create).toHaveBeenCalledTimes(2)
    expect(tx.stock.update).not.toHaveBeenCalled()
    // mulai dari 0, jadi beratSesudah = berat item
    expect(tx.stockMutation.create.mock.calls[0][0].data.beratSebelum.toString()).toBe("0")
  })

  it("menulis AuditLog di transaksi yang sama (§2.5 aturan 2)", async () => {
    const tx = mockTransaction()
    await POST(post(validBody))
    expect(tx.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          aksi: "BUAT_SETORAN",
          entitas: "Setoran",
          userId: "u-petugas",
        }),
      }),
    )
  })
})

describe("GET /api/setoran — scope & filter", () => {
  beforeEach(() => mPrisma.setoran.findMany.mockResolvedValue([]))

  it("petugas dibatasi ke bank sampahnya", async () => {
    const res = await GET(new Request("http://x/api/setoran"))
    expect(res.status).toBe(200)
    expect(mPrisma.setoran.findMany.mock.calls[0][0].where).toEqual({
      bankSampahId: "bs-mawar",
    })
  })

  it("admin melihat semua bank sampah", async () => {
    mAuth.mockResolvedValue(adminUser)
    await GET(new Request("http://x/api/setoran"))
    expect(mPrisma.setoran.findMany.mock.calls[0][0].where).toEqual({})
  })

  it("filter tanggal diterapkan sebagai rentang inklusif", async () => {
    mAuth.mockResolvedValue(adminUser)
    await GET(new Request("http://x/api/setoran?dari=2026-08-01&sampai=2026-08-31"))
    const where = mPrisma.setoran.findMany.mock.calls[0][0].where
    expect(where.tanggal.gte).toEqual(new Date("2026-08-01"))
    expect(where.tanggal.lte).toEqual(new Date("2026-08-31"))
  })

  it("422 untuk tanggal tidak valid", async () => {
    const res = await GET(new Request("http://x/api/setoran?dari=bukan-tanggal"))
    expect(res.status).toBe(422)
    expect(mPrisma.setoran.findMany).not.toHaveBeenCalled()
  })
})
