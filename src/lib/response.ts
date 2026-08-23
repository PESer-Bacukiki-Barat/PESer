/**
 * Kontrak respons API — PRD §2.5 [WAJIB].
 *
 * Tim UI/UX bergantung pada bentuk ini, jadi jangan mengembalikan
 * Response.json mentah dari Route Handler. Pakai ok()/created()/fail().
 *
 *   sukses : { success: true,  data: ... }
 *   gagal  : { success: false, error: { code, message, field? } }
 */

/** Kode error yang didaftarkan PRD §2.5. */
export type PrdErrorCode =
  | "TIDAK_TERAUTENTIKASI"
  | "AKSES_DITOLAK"
  | "TIDAK_DITEMUKAN"
  | "VALIDASI_GAGAL"
  | "STOCK_TIDAK_CUKUP"
  | "TRANSISI_TIDAK_VALID"
  | "HARGA_TIDAK_AKTIF"
  | "DUPLIKAT_IDEMPOTENCY"

/**
 * Tambahan di luar tabel PRD — BELUM DIRATIFIKASI TIM.
 *
 * Tabel §2.5 tidak punya kode untuk dua situasi yang sudah dipakai kode
 * yang ada, dan memaksakannya ke kode yang ada akan mengubah status HTTP
 * (mis. 409 -> 422) sehingga merusak perilaku yang sudah diandalkan:
 *
 * - DUPLIKAT (409): pelanggaran unique, mis. kodeWilayah/email sudah dipakai.
 * - PERMINTAAN_GAGAL (400): kegagalan tulis tak terduga dari database.
 *
 * Kalau tim menolak keduanya, ganti pemetaannya di sini saja — bukan di
 * 91 titik pemanggil.
 */
export type ExtraErrorCode = "DUPLIKAT" | "PERMINTAAN_GAGAL"

export type ApiErrorCode = PrdErrorCode | ExtraErrorCode

const HTTP_STATUS: Record<ApiErrorCode, number> = {
  TIDAK_TERAUTENTIKASI: 401,
  AKSES_DITOLAK: 403,
  TIDAK_DITEMUKAN: 404,
  VALIDASI_GAGAL: 422,
  STOCK_TIDAK_CUKUP: 422,
  TRANSISI_TIDAK_VALID: 409,
  HARGA_TIDAK_AKTIF: 422,
  DUPLIKAT_IDEMPOTENCY: 200,
  DUPLIKAT: 409,
  PERMINTAAN_GAGAL: 400,
}

export type FieldIssue = { field: string; message: string }

export type ApiError = {
  code: ApiErrorCode
  message: string
  field?: string
  /**
   * Tambahan aditif: seluruh isu per-field dari Zod, supaya form bisa
   * menandai beberapa field sekaligus. `field` tetap diisi (isu pertama)
   * agar bentuk PRD terpenuhi bagi konsumen yang hanya membaca itu.
   */
  issues?: FieldIssue[]
}

export type ApiSuccessBody<T> = { success: true; data: T }
export type ApiErrorBody = { success: false; error: ApiError }

/** Respons sukses. */
export function ok<T>(data: T, status = 200): Response {
  return Response.json({ success: true, data } satisfies ApiSuccessBody<T>, { status })
}

/** Respons sukses untuk pembuatan entitas (201). */
export function created<T>(data: T): Response {
  return ok(data, 201)
}

/**
 * Sukses tanpa body. 204 secara definisi tidak boleh membawa body, jadi
 * envelope tidak berlaku di sini — ini pengecualian yang disengaja, bukan
 * kelalaian. Dipakai untuk soft delete.
 */
export function noContent(): Response {
  return new Response(null, { status: 204 })
}

/** Respons gagal. Status HTTP diturunkan dari kode, bukan ditulis manual. */
export function fail(
  code: ApiErrorCode,
  message: string,
  extra?: { field?: string; issues?: FieldIssue[] },
): Response {
  const error: ApiError = { code, message }
  if (extra?.field) error.field = extra.field
  if (extra?.issues?.length) {
    error.issues = extra.issues
    if (!error.field) error.field = extra.issues[0].field
  }
  return Response.json({ success: false, error } satisfies ApiErrorBody, {
    status: HTTP_STATUS[code],
  })
}

type ZodLikeIssue = { path: (string | number | symbol)[]; message: string }

/**
 * Ubah hasil Zod safeParse yang gagal menjadi VALIDASI_GAGAL (422).
 * PRD §2.5 menetapkan 422 untuk input yang tidak lolos Zod — bukan 400.
 */
export function failValidation(issues: ZodLikeIssue[]): Response {
  const mapped: FieldIssue[] = issues.map((i) => ({
    field: i.path.map(String).join("."),
    message: i.message,
  }))
  return fail("VALIDASI_GAGAL", mapped[0]?.message ?? "Input tidak valid", {
    issues: mapped,
  })
}
