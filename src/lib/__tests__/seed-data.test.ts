/**
 * Invarian data seed.
 *
 * Seed yang melanggar aturan bisnis adalah cacat yang paling mahal: setiap
 * anggota tim dan setiap deploy baru mulai dari data yang salah, dan
 * kesalahannya terlihat seperti bug aplikasi. Tesnya di sini karena datanya
 * murni — tidak perlu database untuk membuktikan BR-01, BR-02, dan BR-16
 * dipatuhi.
 */
import {
  BANK_SAMPAH,
  JENIS_SAMPAH,
  KELURAHAN,
  NASABAH,
  PEMBELI,
  SETORAN,
  THRESHOLD,
  USER,
  hargaJenis,
  ringkasanSeed,
} from "@/lib/seed-data"
import { normalkanNoHp } from "@/lib/no-hp"
import { URUTAN_LEVEL } from "@/lib/level-stock"

const namaBankSampah = new Set(BANK_SAMPAH.map((b) => b.nama))
const kodeJenis = new Set(JENIS_SAMPAH.map((j) => j.kode))
const kodeNasabah = new Set(NASABAH.map((n) => n.kodeNasabah))
const emailUser = new Map(USER.map((u) => [u.email, u]))

const duplikat = <T>(nilai: T[]): T[] =>
  nilai.filter((v, i) => nilai.indexOf(v) !== i)

describe("kunci alami unik", () => {
  it.each([
    ["kelurahan.kodeWilayah", KELURAHAN.map((k) => k.kodeWilayah)],
    ["kelurahan.nama", KELURAHAN.map((k) => k.nama)],
    ["bankSampah.nama", BANK_SAMPAH.map((b) => b.nama)],
    ["jenisSampah.kode", JENIS_SAMPAH.map((j) => j.kode)],
    ["jenisSampah.nama", JENIS_SAMPAH.map((j) => j.nama)],
    ["nasabah.kodeNasabah", NASABAH.map((n) => n.kodeNasabah)],
    ["nasabah.noHp", NASABAH.map((n) => n.noHp)],
    ["pembeli.nama", PEMBELI.map((p) => p.nama)],
    ["user.email", USER.map((u) => u.email)],
    ["setoran.kunci", SETORAN.map((s) => s.kunci)],
  ])("%s tidak ada yang kembar", (_nama, nilai) => {
    // Kembar akan membuat upsert menimpa baris yang salah, atau gagal di
    // constraint unique saat penulisan — dua-duanya baru terlihat di runtime.
    expect(duplikat(nilai as unknown[])).toEqual([])
  })

  it("threshold tidak menyebut pasangan bank sampah + jenis dua kali", () => {
    expect(duplikat(THRESHOLD.map((t) => `${t.bankSampah}#${t.jenis}`))).toEqual([])
  })
})

describe("BR-01 — satu kelurahan tepat satu bank sampah", () => {
  it("setiap bank sampah menunjuk kelurahan yang ada", () => {
    const kode = new Set(KELURAHAN.map((k) => k.kodeWilayah))
    for (const b of BANK_SAMPAH) expect(kode.has(b.kodeWilayah)).toBe(true)
  })

  it("tidak ada kelurahan dipakai dua bank sampah", () => {
    // kelurahanId @unique di skema; kembar di sini gagal saat penulisan.
    expect(duplikat(BANK_SAMPAH.map((b) => b.kodeWilayah))).toEqual([])
  })
})

describe("BR-02 — petugas wajib punya bank sampah", () => {
  it("setiap PETUGAS ditugaskan, dan bank sampahnya ada", () => {
    for (const u of USER.filter((x) => x.role === "PETUGAS")) {
      expect(u.bankSampah).not.toBeNull()
      expect(namaBankSampah.has(u.bankSampah!)).toBe(true)
    }
  })

  it("ADMIN tidak punya lingkup satu bank sampah (§5.3)", () => {
    for (const u of USER.filter((x) => x.role === "ADMIN")) {
      expect(u.bankSampah).toBeNull()
    }
  })
})

describe("BR-16 — jenis berharga 0 tidak boleh masuk setoran", () => {
  it("ada contoh jenis berharga 0, supaya aturannya bisa dilihat bekerja", () => {
    expect(JENIS_SAMPAH.some((j) => j.harga <= 0)).toBe(true)
  })

  it("tidak satu pun item setoran memakai jenis berharga 0", () => {
    for (const s of SETORAN) {
      for (const i of s.items) {
        expect(hargaJenis(i.jenis)).toBeGreaterThan(0)
      }
    }
  })
})

describe("acuan antar-entitas utuh", () => {
  it("nasabah menunjuk bank sampah yang ada", () => {
    for (const n of NASABAH) expect(namaBankSampah.has(n.bankSampah)).toBe(true)
  })

  it("setoran menunjuk bank sampah, nasabah, petugas, dan jenis yang ada", () => {
    for (const s of SETORAN) {
      expect(namaBankSampah.has(s.bankSampah)).toBe(true)
      expect(kodeNasabah.has(s.nasabah)).toBe(true)
      expect(emailUser.has(s.petugas)).toBe(true)
      for (const i of s.items) expect(kodeJenis.has(i.jenis)).toBe(true)
    }
  })

  it("threshold menunjuk bank sampah dan jenis yang ada", () => {
    for (const t of THRESHOLD) {
      expect(namaBankSampah.has(t.bankSampah)).toBe(true)
      expect(kodeJenis.has(t.jenis)).toBe(true)
    }
  })

  it("petugas pencatat setoran bertugas di bank sampah setoran itu (§2.5 aturan 4)", () => {
    // Kalau tidak, seed menghasilkan data yang API-nya sendiri akan menolak.
    for (const s of SETORAN) {
      expect(emailUser.get(s.petugas)!.bankSampah).toBe(s.bankSampah)
    }
  })

  it("nasabah setoran memang nasabah bank sampah itu", () => {
    for (const s of SETORAN) {
      const n = NASABAH.find((x) => x.kodeNasabah === s.nasabah)!
      expect(n.bankSampah).toBe(s.bankSampah)
    }
  })
})

describe("penautan akun warga", () => {
  it("noHp akun yang terisi cocok dengan tepat satu nasabah di bank sampahnya", () => {
    for (const u of USER.filter((x) => x.noHp)) {
      const cocok = NASABAH.filter(
        (n) =>
          n.bankSampah === u.bankSampah &&
          normalkanNoHp(n.noHp) === normalkanNoHp(u.noHp),
      )
      expect(cocok).toHaveLength(1)
    }
  })

  it("ada akun tertaut DAN akun tanpa noHp, supaya kedua keadaan bisa dilihat", () => {
    const petugas = USER.filter((u) => u.role === "PETUGAS")
    expect(petugas.some((u) => u.noHp)).toBe(true)
    expect(petugas.some((u) => !u.noHp)).toBe(true)
  })

  it("format noHp akun sengaja berbeda dari yang tersimpan di nasabah", () => {
    // Membuktikan normalisasi benar-benar dipakai, bukan kebetulan sama.
    const tertaut = USER.find((u) => u.noHp)!
    const nasabah = NASABAH.find(
      (n) => normalkanNoHp(n.noHp) === normalkanNoHp(tertaut.noHp),
    )!
    expect(tertaut.noHp).not.toBe(nasabah.noHp)
    expect(normalkanNoHp(tertaut.noHp)).toBe(normalkanNoHp(nasabah.noHp))
  })
})

describe("koordinat bank sampah masuk akal", () => {
  it("berada di sekitar Parepare, bukan (0,0) atau tertukar lat/lng", () => {
    for (const b of BANK_SAMPAH) {
      expect(b.latitude).toBeGreaterThan(-4.2)
      expect(b.latitude).toBeLessThan(-3.8)
      expect(b.longitude).toBeGreaterThan(119.4)
      expect(b.longitude).toBeLessThan(119.9)
    }
  })

  it("tidak ada dua bank sampah di titik yang sama", () => {
    expect(duplikat(BANK_SAMPAH.map((b) => `${b.latitude},${b.longitude}`))).toEqual([])
  })
})

describe("cakupan demo", () => {
  it("keempat level marker peta muncul semua (FR-E2)", () => {
    // Inilah yang membuat seed berguna untuk meninjau peta: tanpa ini,
    // reviewer hanya melihat satu warna dan tidak bisa menilai apa pun.
    const level = ringkasanSeed().map((r) => r.level)
    for (const l of URUTAN_LEVEL) expect(level).toContain(l)
  })

  it("ringkasan cocok dengan yang direncanakan per bank sampah", () => {
    expect(ringkasanSeed()).toEqual([
      { bankSampah: "BS Mawar", berat: 215, threshold: 110, level: "SIAP_JEMPUT" },
      { bankSampah: "BS Melati", berat: 95, threshold: 150, level: "NORMAL" },
      { bankSampah: "BS Anggrek", berat: 30, threshold: 0, level: "TERISI" },
      { bankSampah: "BS Kenanga", berat: 0, threshold: 0, level: "KOSONG" },
    ])
  })

  it("ada satu stock tepat di bawah ambangnya, supaya FR-E5 bisa dipicu", () => {
    // Setoran kecil berikutnya di jenis ini melewati ambang dan mengirim
    // notifikasi ke admin — tanpa menyiapkan data lebih dulu.
    const berat = SETORAN.filter((s) => s.bankSampah === "BS Melati").reduce(
      (a, s) => a + s.items.filter((i) => i.jenis === 101).reduce((b, i) => b + i.berat, 0),
      0,
    )
    const ambang = THRESHOLD.find(
      (t) => t.bankSampah === "BS Melati" && t.jenis === 101,
    )!.threshold

    expect(berat).toBeLessThan(ambang)
    expect(ambang - berat).toBeLessThanOrEqual(10)
  })

  it("ada bank sampah non-aktif, keadaan yang digambar beda di peta", () => {
    expect(BANK_SAMPAH.some((b) => !b.isActive)).toBe(true)
  })

  it("setoran tersebar di beberapa hari, supaya filter periode laporan ada isinya", () => {
    const hari = new Set(SETORAN.map((s) => s.hariLalu))
    expect(hari.size).toBeGreaterThan(2)
    for (const s of SETORAN) expect(s.hariLalu).toBeGreaterThanOrEqual(0)
  })

  it("berat setiap item positif (BR-07/BR-08)", () => {
    for (const s of SETORAN) {
      for (const i of s.items) {
        expect(i.berat).toBeGreaterThan(0)
        // Decimal(10,2): lebih dari 2 desimal akan dibulatkan diam-diam.
        expect(Number(i.berat.toFixed(2))).toBe(i.berat)
      }
    }
  })
})

describe("gerbang kualitas di data seed (FR-C2, BR-18)", () => {
  const semuaTolakan = SETORAN.flatMap((s) => s.ditolak ?? [])

  it("ada contoh penolakan, supaya fiturnya terlihat tanpa membuat data sendiri", () => {
    expect(semuaTolakan.length).toBeGreaterThan(0)
  })

  it("setiap penolakan punya deskripsi dan berat positif", () => {
    for (const d of semuaTolakan) {
      expect(d.deskripsi.trim()).not.toHaveLength(0)
      expect(d.berat).toBeGreaterThan(0)
    }
  })

  it("alasan LAINNYA selalu disertai catatan (PRD §4.1)", () => {
    for (const d of semuaTolakan) {
      if (d.alasan === "LAINNYA") expect(d.catatan?.trim()).toBeTruthy()
    }
  })

  it("berat tolakan TIDAK ikut ke ringkasan stock — BR-18", () => {
    // Inilah jaminan strukturalnya: ringkasanSeed() menjumlahkan items saja.
    // Kalau suatu saat tolakan ikut terhitung, angka di sini akan bergeser dan
    // tes ini merah sebelum siapa pun melihatnya di layar.
    const beratTolakan = semuaTolakan.reduce((a, d) => a + d.berat, 0)
    expect(beratTolakan).toBeGreaterThan(0)

    const totalRingkasan = ringkasanSeed().reduce((a, r) => a + r.berat, 0)
    const totalItem = SETORAN.reduce(
      (a, s) => a + s.items.reduce((b, i) => b + i.berat, 0),
      0,
    )
    expect(totalRingkasan).toBe(totalItem)
    expect(totalRingkasan).not.toBe(totalItem + beratTolakan)
  })

  it("level peta tidak berubah oleh adanya penolakan", () => {
    // Penolakan ditambahkan ke seed setelah level dirancang; kalau ia bocor ke
    // perhitungan stock, salah satu bank sampah akan berpindah level.
    expect(ringkasanSeed().map((r) => r.level)).toEqual([
      "SIAP_JEMPUT",
      "NORMAL",
      "TERISI",
      "KOSONG",
    ])
  })
})
