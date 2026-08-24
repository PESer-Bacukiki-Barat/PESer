/**
 * AuditLog — PRD §2.5 aturan 2 [WAJIB] dan larangan §5.3.
 *
 * Dua hal yang dijaga di sini tidak terlihat dari status HTTP: audit benar-benar
 * ditulis di transaksi yang SAMA dengan operasinya (kalau tidak, jejak bisa
 * tercatat untuk operasi yang gagal), dan payload tidak pernah membawa
 * passwordHash.
 */
import { prisma } from "@/lib/prisma"
import { aksiAudit, bersihkanPayload, tulisAudit, denganAudit } from "@/lib/audit"

jest.mock("@/lib/prisma", () => {
  const m = { auditLog: { create: jest.fn() }, $transaction: jest.fn() }
  return { prisma: m }
})

const mPrisma = prisma as unknown as {
  auditLog: { create: jest.Mock }
  $transaction: jest.Mock
}

beforeEach(() => {
  mPrisma.$transaction.mockImplementation((cb: (t: typeof prisma) => unknown) => cb(prisma))
})

describe("aksiAudit", () => {
  it.each([
    ["BUAT", "Kelurahan", "BUAT_KELURAHAN"],
    ["UBAH", "BankSampah", "UBAH_BANK_SAMPAH"],
    ["HAPUS", "JenisSampah", "HAPUS_JENIS_SAMPAH"],
    ["BUAT", "User", "BUAT_USER"],
  ] as const)("%s %s -> %s", (operasi, entitas, harapan) => {
    expect(aksiAudit(operasi, entitas)).toBe(harapan)
  })
})

describe("bersihkanPayload", () => {
  it("menyensor passwordHash dan password", () => {
    const hasil = bersihkanPayload({
      email: "a@b.c",
      password: "rahasia",
      passwordHash: "$2a$10$abcdef",
    }) as Record<string, unknown>
    expect(hasil.email).toBe("a@b.c")
    expect(hasil.password).toBe("[disensor]")
    expect(hasil.passwordHash).toBe("[disensor]")
  })

  it("menyensor sampai objek bersarang", () => {
    const hasil = bersihkanPayload({
      nama: "Andi",
      credential: { email: "a@b.c", passwordHash: "$2a$10$xyz" },
    }) as { credential: Record<string, unknown> }
    expect(hasil.credential.passwordHash).toBe("[disensor]")
    expect(hasil.credential.email).toBe("a@b.c")
  })

  it("menyensor di dalam array", () => {
    const hasil = bersihkanPayload([{ passwordHash: "x" }, { passwordHash: "y" }]) as Record<
      string,
      unknown
    >[]
    expect(hasil.map((r) => r.passwordHash)).toEqual(["[disensor]", "[disensor]"])
  })

  it("menyensor idempotencyKey supaya kunci replay tidak bocor", () => {
    const hasil = bersihkanPayload({ idempotencyKey: "abc-123" }) as Record<string, unknown>
    expect(hasil.idempotencyKey).toBe("[disensor]")
  })

  it("membuat Date dan Decimal bisa diserialisasi", () => {
    const hasil = bersihkanPayload({
      tanggal: new Date("2026-08-24T00:00:00.000Z"),
      berat: { toJSON: () => "12.50" },
    }) as Record<string, unknown>
    expect(hasil.tanggal).toBe("2026-08-24T00:00:00.000Z")
    expect(hasil.berat).toBe("12.50")
  })
})

describe("tulisAudit", () => {
  it("menulis lewat client transaksi yang diberikan", async () => {
    const tx = { auditLog: { create: jest.fn() } }
    await tulisAudit(tx as unknown as Parameters<typeof tulisAudit>[0], {
      operasi: "BUAT",
      entitas: "Kelurahan",
      entitasId: "c1",
      userId: "u1",
      after: { id: "c1", nama: "Sukamaju" },
    })
    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: {
        userId: "u1",
        aksi: "BUAT_KELURAHAN",
        entitas: "Kelurahan",
        entitasId: "c1",
        payloadAfter: { id: "c1", nama: "Sukamaju" },
      },
    })
  })

  it("tidak menyertakan payload yang tidak relevan (kolom Json? menolak null)", async () => {
    const tx = { auditLog: { create: jest.fn() } }
    await tulisAudit(tx as unknown as Parameters<typeof tulisAudit>[0], {
      operasi: "HAPUS",
      entitas: "Pembeli",
      entitasId: "p1",
      userId: "u1",
      before: { id: "p1" },
    })
    const data = tx.auditLog.create.mock.calls[0][0].data
    expect(data).toHaveProperty("payloadBefore")
    expect(data).not.toHaveProperty("payloadAfter")
  })
})

describe("denganAudit", () => {
  it("menjalankan operasi dan audit dalam SATU transaksi", async () => {
    const jalankan = jest.fn().mockResolvedValue({ id: "c1", nama: "Sukamaju" })
    await denganAudit(
      { operasi: "BUAT", entitas: "Kelurahan", userId: "u1" },
      jalankan,
    )
    expect(mPrisma.$transaction).toHaveBeenCalledTimes(1)
    // tx yang diberikan ke operasi sama dengan yang menulis audit
    expect(jalankan.mock.calls[0][0]).toBe(prisma)
    expect(mPrisma.auditLog.create).toHaveBeenCalledTimes(1)
  })

  it("mengambil entitasId dari hasil operasi", async () => {
    await denganAudit({ operasi: "BUAT", entitas: "Pembeli", userId: "u1" }, () =>
      Promise.resolve({ id: "p9" }),
    )
    expect(mPrisma.auditLog.create.mock.calls[0][0].data.entitasId).toBe("p9")
  })

  it("menyertakan keadaan sebelum kalau bacaSebelum diberikan", async () => {
    await denganAudit(
      { operasi: "UBAH", entitas: "Kelurahan", userId: "u1" },
      () => Promise.resolve({ id: "c1", nama: "Baru" }),
      () => Promise.resolve({ id: "c1", nama: "Lama" }),
    )
    const data = mPrisma.auditLog.create.mock.calls[0][0].data
    expect(data.payloadBefore).toEqual({ id: "c1", nama: "Lama" })
    expect(data.payloadAfter).toEqual({ id: "c1", nama: "Baru" })
  })

  it("melewatkan payloadBefore kalau barisnya tidak ada", async () => {
    await denganAudit(
      { operasi: "HAPUS", entitas: "Kelurahan", userId: "u1" },
      () => Promise.resolve({ id: "c1" }),
      () => Promise.resolve(undefined),
    )
    expect(mPrisma.auditLog.create.mock.calls[0][0].data).not.toHaveProperty("payloadBefore")
  })

  it("operasi gagal berarti audit tidak ditulis, dan error diteruskan", async () => {
    const boom = new Error("P2002")
    await expect(
      denganAudit({ operasi: "BUAT", entitas: "Kelurahan", userId: "u1" }, () =>
        Promise.reject(boom),
      ),
    ).rejects.toBe(boom)
    // penting: route handler mengandalkan error ini untuk memetakan 409/404
    expect(mPrisma.auditLog.create).not.toHaveBeenCalled()
  })

  it("menyensor passwordHash yang ikut di hasil operasi", async () => {
    await denganAudit({ operasi: "BUAT", entitas: "User", userId: "u1" }, () =>
      Promise.resolve({ id: "u9", email: "a@b.c", passwordHash: "$2a$10$rahasia" }),
    )
    const after = mPrisma.auditLog.create.mock.calls[0][0].data.payloadAfter
    expect(after.passwordHash).toBe("[disensor]")
  })
})
