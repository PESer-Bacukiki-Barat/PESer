/**
 * scopeToBankSampah — PRD §5.3 [WAJIB] dan §2.5 aturan 4.
 * Kriteria F-Security: scope diambil dari sesi, bukan dari body request.
 */
import { scopeToBankSampah } from "@/lib/scope"
import type { AppUser } from "@/lib/auth"

const petugas = (bankSampahId: string | null) =>
  ({ id: "u1", role: "PETUGAS", bankSampahId }) as unknown as AppUser

const admin = () => ({ id: "u2", role: "ADMIN", bankSampahId: null }) as unknown as AppUser

describe("scopeToBankSampah", () => {
  it("mengembalikan bankSampahId petugas", () => {
    const hasil = scopeToBankSampah(petugas("bs1"))
    expect(hasil).toEqual({ ok: true, bankSampahId: "bs1" })
  })

  it("menolak admin: tidak punya scope tunggal", async () => {
    const hasil = scopeToBankSampah(admin())
    expect(hasil.ok).toBe(false)
    if (hasil.ok) throw new Error("seharusnya gagal")
    expect(hasil.response.status).toBe(403)
    expect((await hasil.response.json()).error.code).toBe("AKSES_DITOLAK")
  })

  it("menolak petugas yang belum ditugaskan (BR-02)", async () => {
    const hasil = scopeToBankSampah(petugas(null))
    expect(hasil.ok).toBe(false)
    if (hasil.ok) throw new Error("seharusnya gagal")
    expect(hasil.response.status).toBe(403)
    expect((await hasil.response.json()).error.message).toMatch(/belum ditugaskan/)
  })
})
