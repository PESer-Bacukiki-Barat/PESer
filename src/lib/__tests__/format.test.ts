/**
 * Pemformat bersama.
 *
 * Sebelum modul ini ada, 34 definisi lokal tersebar di 19 berkas dan sudah
 * menyimpang: sebelas tempat membulatkan rupiah ke satuan, empat tempat lain
 * membiarkan dua desimal. Nilai yang SAMA bisa tampil "Rp 15.001" di satu
 * layar dan "Rp 15.000,5" di layar berikutnya.
 */
import {
  fmtAngka,
  fmtBerat,
  fmtBeratKg,
  fmtRupiah,
  fmtTanggal,
  fmtTanggalPanjang,
  fmtTanggalWaktu,
} from "@/lib/format"

// Intl memakai U+00A0 (spasi tak terputus) setelah "Rp"; dinormalkan supaya
// assertion-nya terbaca manusia dan tidak bergantung pada karakter tak terlihat.
const rp = (n: number | null | undefined) => fmtRupiah(n).replace(/ /g, " ")

describe("fmtRupiah", () => {
  it("membulatkan ke satuan — rupiah tidak punya pecahan yang dipakai", () => {
    expect(rp(15000)).toBe("Rp 15.000")
    expect(rp(15000.5)).toBe("Rp 15.001")
    expect(rp(985400)).toBe("Rp 985.400")
  })

  it("tidak pernah memunculkan desimal, apa pun masukannya", () => {
    // Inilah penyimpangan yang dulu ada: empat tempat menampilkan ",00" atau
    // ",5" sementara sebelas tempat lain tidak.
    for (const n of [0, 1, 1.4, 1.5, 999.99, 1234567.891]) {
      expect(rp(n)).not.toContain(",")
    }
  })

  it("nol tetap ditampilkan sebagai angka, bukan strip", () => {
    // Rp 0 punya arti (setoran yang seluruhnya ditolak, BR-18); ia bukan
    // "tidak ada data".
    expect(rp(0)).toBe("Rp 0")
  })

  it("null dan undefined jadi strip, bukan 'Rp NaN'", () => {
    expect(fmtRupiah(null)).toBe("—")
    expect(fmtRupiah(undefined)).toBe("—")
    expect(fmtRupiah(Number.NaN)).toBe("—")
  })
})

describe("fmtBerat", () => {
  it("maksimal 2 desimal (BR-08, Decimal(10,2))", () => {
    expect(fmtBerat(12.5)).toBe("12,5")
    expect(fmtBerat(12.567)).toBe("12,57")
  })

  it("bilangan bulat tidak diberi desimal kosong", () => {
    // "5,00 kg" di kartu stock hanya menambah derau tanpa menambah informasi.
    expect(fmtBerat(5)).toBe("5")
    expect(fmtBerat(215)).toBe("215")
  })

  it("ribuan diberi pemisah", () => {
    expect(fmtBerat(1234.5)).toBe("1.234,5")
  })

  it("nol tetap nol", () => {
    expect(fmtBerat(0)).toBe("0")
  })

  it("null jadi strip", () => {
    expect(fmtBerat(null)).toBe("—")
  })

  it("fmtBeratKg menambahkan satuan, tapi tidak pada strip", () => {
    expect(fmtBeratKg(12.5)).toBe("12,5 kg")
    expect(fmtBeratKg(null)).toBe("—")
  })
})

describe("fmtAngka", () => {
  it("memisahkan ribuan", () => {
    expect(fmtAngka(1234)).toBe("1.234")
    expect(fmtAngka(0)).toBe("0")
  })
})

describe("tanggal", () => {
  // Tanggal tetap: hasil format tidak boleh bergantung pada kapan tes berjalan.
  const t = new Date("2026-08-29T14:30:00")

  it("bentuk ringkas untuk tabel", () => {
    expect(fmtTanggal(t)).toBe("29 Agu 2026")
  })

  it("bentuk panjang untuk judul & bukti setor", () => {
    expect(fmtTanggalPanjang(t)).toBe("29 Agustus 2026")
  })

  it("bentuk berjam saat waktunya ikut penting", () => {
    expect(fmtTanggalWaktu(t)).toContain("29 Agu 2026")
    expect(fmtTanggalWaktu(t)).toMatch(/14[.:]30/)
  })

  it("menerima string ISO, bukan hanya objek Date", () => {
    // Data dari API datang sebagai string; memaksa pemanggil membungkusnya
    // sendiri adalah cara paling mudah menghasilkan "Invalid Date".
    expect(fmtTanggal("2026-08-29T00:00:00.000Z")).toContain("2026")
  })

  it("masukan tidak sah jadi strip, bukan 'Invalid Date'", () => {
    expect(fmtTanggal("bukan tanggal")).toBe("—")
    expect(fmtTanggal(null)).toBe("—")
    expect(fmtTanggalWaktu(undefined)).toBe("—")
  })
})
