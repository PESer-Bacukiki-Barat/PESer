/**
 * Tabel aksi dispatch — sumber kebenaran bersama UI dan server (PRD §8.2).
 *
 * Modul ini yang menentukan tombol apa yang muncul di halaman detail. Kalau ia
 * salah, UI menawarkan aksi yang akan ditolak API, atau menyembunyikan aksi
 * yang sebenarnya sah — dua-duanya tidak terlihat dari status HTTP.
 */
import type { StatusDispatch } from "@/generated/prisma/client"
import {
  TRANSISI,
  STATUS_FINAL,
  BOLEH_REVISI,
  MENAHAN_RESERVASI,
  aksiTersedia,
  pelakuBoleh,
  transisiDari,
  type PenggunaAksi,
} from "@/lib/dispatch-aksi"

const BS = "bs-mawar"
const admin: PenggunaAksi = { role: "ADMIN", bankSampahId: null }
const pemilik: PenggunaAksi = { role: "PETUGAS", bankSampahId: BS }
const petugasLain: PenggunaAksi = { role: "PETUGAS", bankSampahId: "bs-melati" }

const SEMUA_STATUS: StatusDispatch[] = [
  "DRAFT",
  "DISPATCHED",
  "DITERIMA",
  "DITOLAK",
  "SERAH_TERIMA",
  "SELESAI",
  "DIBATALKAN",
]

describe("tabel §8.2", () => {
  it("memuat tepat 10 transisi resmi", () => {
    expect(TRANSISI).toHaveLength(10)
  })

  it("tidak ada transisi keluar dari status final (BR-13)", () => {
    for (const status of STATUS_FINAL) {
      expect(transisiDari(status)).toHaveLength(0)
    }
  })

  it("tidak ada transisi ganda untuk pasangan dari->ke yang sama", () => {
    const kunci = TRANSISI.map((t) => `${t.dari}->${t.ke}`)
    expect(new Set(kunci).size).toBe(kunci.length)
  })

  it("status yang menahan reservasi punya jalan keluar untuk melepasnya", () => {
    // Kalau tidak, reservasi bisa tertahan selamanya.
    for (const status of MENAHAN_RESERVASI) {
      const keluar = transisiDari(status).map((t) => t.ke)
      expect(keluar).toContain("DIBATALKAN")
    }
  })
})

describe("pelakuBoleh", () => {
  it("ADMIN hanya untuk role ADMIN", () => {
    expect(pelakuBoleh("ADMIN", admin, BS)).toBe(true)
    expect(pelakuBoleh("ADMIN", pemilik, BS)).toBe(false)
  })

  it("PETUGAS_PEMILIK menuntut bankSampahId yang sama", () => {
    expect(pelakuBoleh("PETUGAS_PEMILIK", pemilik, BS)).toBe(true)
    expect(pelakuBoleh("PETUGAS_PEMILIK", petugasLain, BS)).toBe(false)
    expect(pelakuBoleh("PETUGAS_PEMILIK", admin, BS)).toBe(false)
  })
})

describe("aksiTersedia", () => {
  const label = (u: PenggunaAksi, s: StatusDispatch) =>
    aksiTersedia(s, u, BS).map((a) => a.ke).sort()

  it("ADMIN pada DRAFT: terbitkan atau batalkan", () => {
    expect(label(admin, "DRAFT")).toEqual(["DIBATALKAN", "DISPATCHED"])
  })

  it("ADMIN pada DISPATCHED: hanya batalkan (terima/tolak milik petugas)", () => {
    expect(label(admin, "DISPATCHED")).toEqual(["DIBATALKAN"])
  })

  it("PETUGAS pemilik pada DISPATCHED: terima atau tolak", () => {
    expect(label(pemilik, "DISPATCHED")).toEqual(["DITERIMA", "DITOLAK"])
  })

  it("PETUGAS pemilik pada DITERIMA: serah terima", () => {
    expect(label(pemilik, "DITERIMA")).toEqual(["SERAH_TERIMA"])
  })

  it("ADMIN pada SERAH_TERIMA: tutup", () => {
    expect(label(admin, "SERAH_TERIMA")).toEqual(["SELESAI"])
  })

  it("ADMIN pada DITOLAK: kembalikan ke draft atau batalkan", () => {
    expect(label(admin, "DITOLAK")).toEqual(["DIBATALKAN", "DRAFT"])
  })

  it("petugas bank sampah lain tidak pernah dapat aksi", () => {
    for (const s of SEMUA_STATUS) {
      expect(aksiTersedia(s, petugasLain, BS)).toHaveLength(0)
    }
  })

  it("status final tidak menawarkan aksi ke siapa pun", () => {
    for (const s of STATUS_FINAL) {
      expect(aksiTersedia(s, admin, BS)).toHaveLength(0)
      expect(aksiTersedia(s, pemilik, BS)).toHaveLength(0)
    }
  })

  it("setiap aksi punya label, slug, dan keterangan yang terisi", () => {
    for (const s of SEMUA_STATUS) {
      for (const a of [...aksiTersedia(s, admin, BS), ...aksiTersedia(s, pemilik, BS)]) {
        expect(a.label.length).toBeGreaterThan(0)
        expect(a.slug).toMatch(/^[a-z-]+$/)
        expect(a.keterangan.length).toBeGreaterThan(0)
      }
    }
  })
})

describe("slug aksi punya endpoint yang benar-benar ada", () => {
  /**
   * Menangkap kelas bug yang sudah pernah terjadi: transisi DITOLAK -> DRAFT
   * sah menurut §8.2 tapi belum punya route, sehingga tidak bisa dipanggil dari
   * mana pun. Daftar di bawah harus mencerminkan folder yang benar-benar ada di
   * src/app/api/dispatch/[id]/.
   */
  const ENDPOINT_ADA = [
    "terbitkan",
    "terima",
    "tolak",
    "serah-terima",
    "tutup",
    "batalkan",
    "revisi",
  ]

  it("semua slug yang bisa muncul di UI ada endpointnya", () => {
    const slugDipakai = new Set(
      SEMUA_STATUS.flatMap((s) => [
        ...aksiTersedia(s, admin, BS),
        ...aksiTersedia(s, pemilik, BS),
      ]).map((a) => a.slug),
    )
    for (const slug of slugDipakai) {
      expect(ENDPOINT_ADA).toContain(slug)
    }
  })

  it("setiap transisi di tabel menghasilkan slug", () => {
    // Tidak boleh ada transisi sah yang tidak bisa dijalankan dari UI.
    const keSemua = new Set(TRANSISI.map((t) => t.ke))
    const slugSemua = new Set(
      SEMUA_STATUS.flatMap((s) => [
        ...aksiTersedia(s, admin, BS),
        ...aksiTersedia(s, pemilik, BS),
      ]).map((a) => a.ke),
    )
    expect([...keSemua].sort()).toEqual([...slugSemua].sort())
  })
})

describe("BOLEH_REVISI", () => {
  it("hanya DRAFT dan DITOLAK", () => {
    expect([...BOLEH_REVISI].sort()).toEqual(["DITOLAK", "DRAFT"])
  })

  it("tidak memuat status final (BR-13)", () => {
    for (const s of STATUS_FINAL) {
      expect(BOLEH_REVISI).not.toContain(s)
    }
  })
})
