/**
 * Kontrak otorisasi seluruh API.
 *
 * Test lain me-mock requireAuth seutuhnya, sehingga argumen role-nya tidak
 * pernah diperiksa — celah yang membuat 12 handler tulis master data bisa
 * dipanggil PETUGAS padahal PRD FR-B1/B2/B4/B6 menetapkan ADMIN.
 * File ini menutup celah itu: ia memverifikasi role yang DIMINTA setiap
 * handler, bukan sekadar bahwa handler menolak saat tidak login.
 */
import { requireAuth } from "@/lib/auth"

import * as kelurahan from "@/app/api/kelurahan/route"
import * as kelurahanId from "@/app/api/kelurahan/[id]/route"
import * as bankSampah from "@/app/api/bank-sampah/route"
import * as bankSampahId from "@/app/api/bank-sampah/[id]/route"
import * as jenisSampah from "@/app/api/jenis-sampah/route"
import * as jenisSampahId from "@/app/api/jenis-sampah/[id]/route"
import * as pembeli from "@/app/api/pembeli/route"
import * as pembeliId from "@/app/api/pembeli/[id]/route"
import * as users from "@/app/api/users/route"
import * as usersId from "@/app/api/users/[id]/route"
import * as dispatch from "@/app/api/dispatch/route"
import * as dispatchId from "@/app/api/dispatch/[id]/route"
import * as profil from "@/app/api/profil/route"
import * as laporanPenjualan from "@/app/api/laporan/penjualan/route"
import * as laporanVolume from "@/app/api/laporan/volume/route"
import * as setoran from "@/app/api/setoran/route"
import * as stock from "@/app/api/stock/route"
import * as terbitkan from "@/app/api/dispatch/[id]/terbitkan/route"
import * as terima from "@/app/api/dispatch/[id]/terima/route"
import * as tolak from "@/app/api/dispatch/[id]/tolak/route"
import * as serahTerima from "@/app/api/dispatch/[id]/serah-terima/route"
import * as tutup from "@/app/api/dispatch/[id]/tutup/route"
import * as batalkan from "@/app/api/dispatch/[id]/batalkan/route"
import * as revisi from "@/app/api/dispatch/[id]/revisi/route"
import * as notifikasi from "@/app/api/notifikasi/route"
import * as notifikasiBaca from "@/app/api/notifikasi/baca/route"
import * as foto from "@/app/api/dispatch/[id]/foto/route"

jest.mock("@/lib/auth", () => ({ requireAuth: jest.fn() }))
jest.mock("@/lib/prisma", () => ({ prisma: {} }))

const mAuth = requireAuth as jest.Mock

// Guard menolak lebih dulu, jadi handler pulang sebelum menyentuh prisma
// maupun mem-parse body. Request dummy sudah cukup.
const forbidden = {
  ok: false,
  response: Response.json({ error: "forbidden" }, { status: 403 }),
}

type Handler = (req: Request, ctx: { params: Promise<{ id: string }> }) => Promise<Response>

const ctx = { params: Promise.resolve({ id: "x1" }) }
const req = () => new Request("http://x", { method: "POST", body: "{}" })

/** Handler tulis yang WAJIB meminta role ADMIN. */
const ADMIN_ONLY: [string, Handler][] = [
  // Modul B — Master Data (PRD FR-B1, B2, B4, B6)
  ["POST   /api/kelurahan", kelurahan.POST as Handler],
  ["PUT    /api/kelurahan/[id]", kelurahanId.PUT as Handler],
  ["DELETE /api/kelurahan/[id]", kelurahanId.DELETE as Handler],
  ["POST   /api/bank-sampah", bankSampah.POST as Handler],
  ["PUT    /api/bank-sampah/[id]", bankSampahId.PUT as Handler],
  ["DELETE /api/bank-sampah/[id]", bankSampahId.DELETE as Handler],
  ["POST   /api/jenis-sampah", jenisSampah.POST as Handler],
  ["PUT    /api/jenis-sampah/[id]", jenisSampahId.PUT as Handler],
  ["DELETE /api/jenis-sampah/[id]", jenisSampahId.DELETE as Handler],
  ["POST   /api/pembeli", pembeli.POST as Handler],
  ["PUT    /api/pembeli/[id]", pembeliId.PUT as Handler],
  ["DELETE /api/pembeli/[id]", pembeliId.DELETE as Handler],
  // Modul B — Akun Petugas (FR-B3)
  ["GET    /api/users", users.GET as unknown as Handler],
  ["POST   /api/users", users.POST as Handler],
  ["GET    /api/users/[id]", usersId.GET as Handler],
  ["PUT    /api/users/[id]", usersId.PUT as Handler],
  ["DELETE /api/users/[id]", usersId.DELETE as Handler],
  // Modul E — laporan: PRD baris 225 menandai PETUGAS eksplisit TIDAK boleh
  ["GET    /api/laporan/penjualan", laporanPenjualan.GET as Handler],
  ["GET    /api/laporan/volume", laporanVolume.GET as Handler],
  // Modul D — dispatch dibuat & dibatalkan admin (FR-D1, FR-D7)
  ["POST   /api/dispatch", dispatch.POST as Handler],
  ["PUT    /api/dispatch/[id]", dispatchId.PUT as Handler],
  ["DELETE /api/dispatch/[id]", dispatchId.DELETE as Handler],
]

/** Handler yang WAJIB meminta role PETUGAS (FR-C1). */
const PETUGAS_ONLY: [string, Handler][] = [
  ["POST   /api/setoran", setoran.POST as Handler],
]

/**
 * GET master data HARUS tetap terbuka untuk semua yang sudah login:
 * petugas perlu membaca harga jenis sampah dan bank sampahnya sendiri
 * untuk input setoran (FR-C1). Mengencangkan ini ke ADMIN akan memutus
 * alur setoran, jadi test ini menjaga dari arah sebaliknya.
 */
const ANY_LOGGED_IN: [string, Handler][] = [
  ["GET    /api/kelurahan", kelurahan.GET as unknown as Handler],
  ["GET    /api/kelurahan/[id]", kelurahanId.GET as Handler],
  ["GET    /api/bank-sampah", bankSampah.GET as unknown as Handler],
  ["GET    /api/bank-sampah/[id]", bankSampahId.GET as Handler],
  ["GET    /api/jenis-sampah", jenisSampah.GET as unknown as Handler],
  ["GET    /api/jenis-sampah/[id]", jenisSampahId.GET as Handler],
  ["GET    /api/pembeli", pembeli.GET as unknown as Handler],
  ["GET    /api/pembeli/[id]", pembeliId.GET as Handler],
  // Riwayat transaksi & stock dibaca kedua role, dibatasi scope bukan role
  // (FR-C5/C6/C9) — scope-nya sendiri diuji di setoran.test.ts & stock.test.ts.
  // Profil sendiri (FR-A2) juga terbuka untuk kedua role: yang membatasi bukan
  // peran, tapi id dari sesi — diuji di profil.test.ts.
  ["GET    /api/profil", profil.GET as unknown as Handler],
  ["PATCH  /api/profil", profil.PATCH as unknown as Handler],
  ["GET    /api/setoran", setoran.GET as Handler],
  ["GET    /api/stock", stock.GET as unknown as Handler],
  // Notifikasi milik kedua peran (FR-E5). Yang membatasi bukan peran melainkan
  // userId dari sesi — diuji di notifikasi.test.ts.
  ["GET    /api/notifikasi", notifikasi.GET as unknown as Handler],
  ["POST   /api/notifikasi/baca", notifikasiBaca.POST as unknown as Handler],
]

/**
 * Endpoint aksi dispatch: pelakunya ditentukan PER TRANSISI oleh tabel §8.2
 * ("ADMIN" atau "PETUGAS pemilik"), bukan per endpoint. Karena itu handler
 * hanya menuntut login, dan pengecekan peran ada di transisiDispatch() supaya
 * tetap satu sumber kebenaran — diuji di lib/__tests__/dispatch-transisi.test.ts.
 *
 * Foto bukti (FR-D5) mengikuti pola yang sama: handler hanya menuntut login,
 * dan "PETUGAS pemilik" diperiksa di dalamnya lewat `pelakuBoleh` — helper yang
 * sama dengan state machine, bukan definisi kedua. Aturan siapa-boleh-apa-nya
 * diuji di foto-bukti.test.ts.
 */
const AKSI_DISPATCH: [string, Handler][] = [
  ["POST   /api/dispatch/[id]/terbitkan", terbitkan.POST as Handler],
  ["POST   /api/dispatch/[id]/terima", terima.POST as Handler],
  ["POST   /api/dispatch/[id]/tolak", tolak.POST as Handler],
  ["POST   /api/dispatch/[id]/serah-terima", serahTerima.POST as Handler],
  ["POST   /api/dispatch/[id]/tutup", tutup.POST as Handler],
  ["POST   /api/dispatch/[id]/batalkan", batalkan.POST as Handler],
  ["POST   /api/dispatch/[id]/revisi", revisi.POST as Handler],
  ["GET    /api/dispatch/[id]/foto", foto.GET as Handler],
  ["POST   /api/dispatch/[id]/foto", foto.POST as Handler],
  ["DELETE /api/dispatch/[id]/foto", foto.DELETE as Handler],
]

beforeEach(() => {
  mAuth.mockReset()
  mAuth.mockResolvedValue(forbidden)
})

describe("handler tulis master data wajib ADMIN", () => {
  it.each(ADMIN_ONLY)("%s meminta ADMIN", async (_name, handler) => {
    const res = await handler(req(), ctx)
    expect(mAuth).toHaveBeenCalledWith("ADMIN")
    expect(res.status).toBe(403)
  })
})

describe("koreksi stock wajib PETUGAS", () => {
  it.each(PETUGAS_ONLY)("%s meminta PETUGAS", async (_name, handler) => {
    const res = await handler(req(), ctx)
    expect(mAuth).toHaveBeenCalledWith("PETUGAS")
    expect(res.status).toBe(403)
  })
})

describe("endpoint aksi dispatch menuntut login, peran dicek per transisi", () => {
  it.each(AKSI_DISPATCH)("%s tidak menuntut peran di handler", async (_name, handler) => {
    const res = await handler(req(), ctx)
    expect(mAuth).toHaveBeenCalledWith()
    // requireAuth ditolak -> handler pulang tanpa menyentuh state machine
    expect(res.status).toBe(403)
  })
})

describe("GET master data terbuka untuk semua yang sudah login", () => {
  it.each(ANY_LOGGED_IN)("%s tidak menuntut role tertentu", async (_name, handler) => {
    await handler(req(), ctx)
    expect(mAuth).toHaveBeenCalledWith()
  })
})

/**
 * Sengaja TIDAK diuji di sini karena kewenangannya belum diputuskan, dan
 * menuliskan perilaku sekarang sebagai "benar" akan mengunci keputusan yang
 * keliru:
 *
 * - /api/nasabah (POST/PUT/DELETE): matriks §2.4 baris 209 menulis ADMIN ❌ /
 *   PETUGAS ✅, tapi UI yang sudah jadi menempatkannya di panel admin. Dua hal
 *   itu masih bertentangan, jadi PERAN yang dituntut handler-nya belum
 *   dikunci di sini.
 *
 *   Yang SUDAH diputuskan dan sudah dikunci: apa pun jawaban soal peran,
 *   PETUGAS tidak boleh keluar dari bank sampahnya (§2.5 aturan 4). Lingkup
 *   itu diuji di nasabah.test.ts — GET tersaring, bankSampahId dari body
 *   diabaikan, dan nasabah pos lain menghasilkan 404.
 */
