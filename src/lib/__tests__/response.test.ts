/**
 * Menjaga kontrak respons PRD §2.5 [WAJIB].
 *
 * Tim UI/UX bergantung pada bentuk ini, jadi perubahan bentuk atau pemetaan
 * status harus memecahkan test ini lebih dulu — bukan ditemukan di produksi.
 */
import { ok, created, noContent, fail, failValidation } from "@/lib/response"

describe("bentuk respons sukses", () => {
  it("ok() membungkus data dan default 200", async () => {
    const res = ok({ id: "c1" })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ success: true, data: { id: "c1" } })
  })

  it("ok() meneruskan array tanpa mengubahnya", async () => {
    const res = ok([{ id: "c1" }, { id: "c2" }])
    expect(await res.json()).toEqual({ success: true, data: [{ id: "c1" }, { id: "c2" }] })
  })

  it("created() memakai 201", async () => {
    const res = created({ id: "c1" })
    expect(res.status).toBe(201)
    expect(await res.json()).toEqual({ success: true, data: { id: "c1" } })
  })

  it("noContent() 204 tanpa body", () => {
    const res = noContent()
    expect(res.status).toBe(204)
    expect(res.body).toBeNull()
  })
})

describe("bentuk respons gagal", () => {
  it("fail() memakai bentuk { success:false, error:{code,message} }", async () => {
    const res = fail("TIDAK_DITEMUKAN", "Data tidak ditemukan")
    expect(await res.json()).toEqual({
      success: false,
      error: { code: "TIDAK_DITEMUKAN", message: "Data tidak ditemukan" },
    })
  })

  it("fail() menyertakan field bila diberikan", async () => {
    const res = fail("DUPLIKAT", "email sudah dipakai", { field: "email" })
    const body = await res.json()
    expect(body.error.field).toBe("email")
  })
})

describe("pemetaan kode error ke status HTTP", () => {
  // Angka-angka ini berasal langsung dari tabel PRD §2.5.
  it.each([
    ["TIDAK_TERAUTENTIKASI", 401],
    ["AKSES_DITOLAK", 403],
    ["TIDAK_DITEMUKAN", 404],
    ["VALIDASI_GAGAL", 422],
    ["STOCK_TIDAK_CUKUP", 422],
    ["TRANSISI_TIDAK_VALID", 409],
    ["HARGA_TIDAK_AKTIF", 422],
    ["DUPLIKAT_IDEMPOTENCY", 200],
  ] as const)("%s -> %i", (code, status) => {
    expect(fail(code, "pesan").status).toBe(status)
  })

  // Tambahan di luar tabel PRD, belum diratifikasi tim - lihat response.ts.
  it.each([
    ["DUPLIKAT", 409],
    ["PERMINTAAN_GAGAL", 400],
  ] as const)("%s -> %i (tambahan)", (code, status) => {
    expect(fail(code, "pesan").status).toBe(status)
  })
})

describe("failValidation", () => {
  it("422 dengan kode VALIDASI_GAGAL", async () => {
    const res = failValidation([{ path: ["nama"], message: "nama wajib" }])
    expect(res.status).toBe(422)
    expect((await res.json()).error.code).toBe("VALIDASI_GAGAL")
  })

  it("memetakan path Zod menjadi field bertitik", async () => {
    const res = failValidation([
      { path: ["items", 0, "beratTarget"], message: "beratTarget harus > 0" },
    ])
    const body = await res.json()
    expect(body.error.field).toBe("items.0.beratTarget")
    expect(body.error.issues).toEqual([
      { field: "items.0.beratTarget", message: "beratTarget harus > 0" },
    ])
  })

  it("menyimpan semua isu supaya form bisa menandai banyak field", async () => {
    const res = failValidation([
      { path: ["nama"], message: "nama wajib" },
      { path: ["kodeWilayah"], message: "kodeWilayah wajib" },
    ])
    const body = await res.json()
    expect(body.error.issues).toHaveLength(2)
    // field diisi isu pertama agar bentuk PRD tetap terpenuhi
    expect(body.error.field).toBe("nama")
  })
})
