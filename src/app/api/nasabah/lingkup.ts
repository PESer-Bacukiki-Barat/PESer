import type { AppUser } from "@/lib/auth"
import { fail } from "@/lib/response"

/**
 * Pembatas bank sampah untuk seluruh handler /api/nasabah.
 *
 * PRD §2.4 baris 209 memberi CRUD Nasabah kepada PETUGAS "bank sampah
 * sendiri". Sebelum ini kelima handler mengabaikannya: GET mengembalikan
 * nasabah SELURUH bank sampah, dan POST/PUT mengambil bankSampahId dari body —
 * jadi petugas satu pos bisa membaca nama, nomor HP, dan alamat warga pos lain,
 * mengubahnya, bahkan memindahkannya ke pos lain.
 *
 * Ditaruh di satu berkas karena aturannya sama untuk kelima handler, dan
 * ketertinggalan di salah satunya adalah persis bentuk cacat yang baru
 * diperbaiki.
 *
 * Catatan: siapa yang BOLEH mengelola nasabah masih pertanyaan terbuka —
 * matriks §2.4 menulis ADMIN ❌ sementara UI yang sudah jadi menempatkannya di
 * panel admin. Helper ini tidak memutuskan itu; ia hanya memastikan PETUGAS
 * tidak pernah keluar dari bank sampahnya. Lihat catatan di
 * src/app/api/__tests__/authorization.test.ts.
 */

/** Filter tambahan untuk query: petugas dibatasi, admin tidak. */
export function filterLingkup(user: AppUser): { bankSampahId?: string } {
  return user.role === "PETUGAS" && user.bankSampahId
    ? { bankSampahId: user.bankSampahId }
    : {}
}

export type LingkupTulis =
  | { ok: true; bankSampahId: string }
  | { ok: false; response: Response }

/**
 * Bank sampah yang dipakai saat MENULIS.
 *
 * Petugas: selalu dari sesi, body diabaikan. Admin: wajib menyebutkannya,
 * karena ia tidak punya satu lingkup (§5.3) dan menebak salah satu bank sampah
 * untuknya akan menaruh warga di pos yang keliru.
 */
export function lingkupTulis(user: AppUser, dariBody?: string): LingkupTulis {
  if (user.role === "PETUGAS") {
    if (!user.bankSampahId) {
      return {
        ok: false,
        response: fail("AKSES_DITOLAK", "Petugas belum ditugaskan ke bank sampah"),
      }
    }
    return { ok: true, bankSampahId: user.bankSampahId }
  }
  if (!dariBody) {
    return {
      ok: false,
      response: fail("VALIDASI_GAGAL", "bankSampahId wajib untuk admin", {
        field: "bankSampahId",
      }),
    }
  }
  return { ok: true, bankSampahId: dariBody }
}
