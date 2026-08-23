/**
 * Jembatan breaking change kontrak PRD §2.5: seluruh respons API kini
 * dibungkus envelope, sementara 20+ pemanggil di komponen tetap menerima
 * payload langsung. Yang menjembatani adalah unwrapEnvelope di klien axios,
 * jadi bagian itu harus dijaga test — bukan hanya terbukti di browser.
 */
import { AxiosError } from "axios"
import { unwrapEnvelope, apiError, apiErrorCode, apiFieldErrors } from "@/lib/api"

function axiosErrorWith(body: unknown, status = 422): AxiosError {
  const err = new AxiosError("gagal")
  err.response = {
    data: body,
    status,
    statusText: "",
    headers: {},
    config: { headers: {} as never },
  }
  return err
}

describe("unwrapEnvelope", () => {
  it("membuka envelope sukses", () => {
    expect(unwrapEnvelope({ success: true, data: { id: "c1" } })).toEqual({ id: "c1" })
  })

  it("membuka array di dalam envelope", () => {
    expect(unwrapEnvelope({ success: true, data: [1, 2] })).toEqual([1, 2])
  })

  it("meneruskan data null di dalam envelope", () => {
    expect(unwrapEnvelope({ success: true, data: null })).toBeNull()
  })

  it("meneruskan body tanpa envelope apa adanya", () => {
    // mis. respons dari /api/auth/* milik next-auth
    expect(unwrapEnvelope({ csrfToken: "abc" })).toEqual({ csrfToken: "abc" })
  })

  it("meneruskan body kosong dari 204", () => {
    expect(unwrapEnvelope("")).toBe("")
    expect(unwrapEnvelope(undefined)).toBeUndefined()
  })

  it("tidak menyentuh body error", () => {
    const body = { success: false, error: { code: "TIDAK_DITEMUKAN", message: "x" } }
    expect(unwrapEnvelope(body)).toEqual(body)
  })
})

describe("apiError / apiErrorCode", () => {
  it("mengambil message dan code dari bentuk PRD", () => {
    const err = axiosErrorWith({
      success: false,
      error: { code: "DUPLIKAT", message: "email sudah dipakai", field: "email" },
    })
    expect(apiError(err)).toBe("email sudah dipakai")
    expect(apiErrorCode(err)).toBe("DUPLIKAT")
  })

  it("pesan cadangan untuk error non-API", () => {
    expect(apiError(new Error("boom"))).toBe("Terjadi kesalahan")
    expect(apiErrorCode(new Error("boom"))).toBeUndefined()
  })
})

describe("apiFieldErrors", () => {
  it("memetakan semua isu ke field masing-masing", () => {
    const err = axiosErrorWith({
      success: false,
      error: {
        code: "VALIDASI_GAGAL",
        message: "nama wajib",
        field: "nama",
        issues: [
          { field: "nama", message: "nama wajib" },
          { field: "kodeWilayah", message: "kodeWilayah wajib" },
        ],
      },
    })
    expect(apiFieldErrors(err)).toEqual({
      nama: "nama wajib",
      kodeWilayah: "kodeWilayah wajib",
    })
  })

  it("memakai segmen pertama untuk field bersarang", () => {
    const err = axiosErrorWith({
      success: false,
      error: {
        code: "VALIDASI_GAGAL",
        message: "beratTarget harus > 0",
        issues: [{ field: "items.0.beratTarget", message: "beratTarget harus > 0" }],
      },
    })
    expect(apiFieldErrors(err)).toEqual({ items: "beratTarget harus > 0" })
  })

  it("error dengan field tunggal dipetakan ke field itu", () => {
    const err = axiosErrorWith({
      success: false,
      error: { code: "DUPLIKAT", message: "email sudah dipakai", field: "email" },
    })
    expect(apiFieldErrors(err)).toEqual({ email: "email sudah dipakai" })
  })

  it("error tanpa field masuk ke _form", () => {
    const err = axiosErrorWith({
      success: false,
      error: { code: "PERMINTAAN_GAGAL", message: "gagal membuat kelurahan" },
    })
    expect(apiFieldErrors(err)).toEqual({ _form: "gagal membuat kelurahan" })
  })

  it("null untuk error non-API", () => {
    expect(apiFieldErrors(new Error("boom"))).toBeNull()
  })
})
