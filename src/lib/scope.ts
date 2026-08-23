import type { AppUser } from "@/lib/auth"
import { fail } from "@/lib/response"

/**
 * Scope bank sampah untuk petugas — PRD §5.3 [WAJIB].
 *
 * "Scope bank sampah tidak boleh diambil dari body request. Selalu dari sesi."
 * (§2.5 aturan 4). Semua query petugas wajib lewat helper ini.
 *
 * Catatan penyimpangan dari contoh kode di PRD §5.3: di sana helper menerima
 * `session` dan melempar ForbiddenError. Di repo ini sesi tidak memuat
 * bankSampahId (JWT hanya membawa role), dan tidak ada middleware yang
 * mengubah error menjadi Response. Jadi helper ini menerima AppUser hasil
 * requireAuth() dan mengembalikan Response gagal — mengikuti pola
 * `{ ok: false, response }` yang sudah dipakai di seluruh Route Handler.
 */
export type ScopeResult =
  | { ok: true; bankSampahId: string }
  | { ok: false; response: Response }

export function scopeToBankSampah(user: AppUser): ScopeResult {
  if (user.role === "ADMIN") {
    return {
      ok: false,
      response: fail("AKSES_DITOLAK", "Admin tidak punya scope bank sampah tunggal"),
    }
  }
  if (!user.bankSampahId) {
    return {
      ok: false,
      response: fail("AKSES_DITOLAK", "Petugas belum ditugaskan ke bank sampah"),
    }
  }
  return { ok: true, bankSampahId: user.bankSampahId }
}
