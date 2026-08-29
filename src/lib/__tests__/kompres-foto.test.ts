/**
 * Kompresi foto bukti — FR-D5, BR-19.
 *
 * Bagian yang menyentuh canvas tidak diuji di sini (butuh DOM); yang diuji
 * adalah aritmetika dan aturan validasinya, karena di situlah kesalahan
 * berakibat: gambar gepeng, sisi nol, atau berkas yang lolos ke server lalu
 * ditolak setelah petugas menunggu lama di sinyal lapangan.
 */
import {
  dimensiTerskala,
  formatUkuran,
  periksaTipe,
  periksaUkuran,
} from "@/lib/kompres-foto"
import { MAKS_DIMENSI_FOTO_PX, MAKS_UKURAN_FOTO_BYTE } from "@/lib/constants"

describe("dimensiTerskala", () => {
  it("gambar yang sudah lebih kecil dari batas tidak diperbesar", () => {
    // Memperbesar hanya menambah byte tanpa menambah informasi.
    const asal = { lebar: 800, tinggi: 600 }
    expect(dimensiTerskala(asal)).toEqual(asal)
  })

  it("tepat di batas dibiarkan apa adanya", () => {
    const asal = { lebar: MAKS_DIMENSI_FOTO_PX, tinggi: 900 }
    expect(dimensiTerskala(asal)).toEqual(asal)
  })

  it("sisi terpanjang diturunkan ke batas, rasio aspek tetap", () => {
    const hasil = dimensiTerskala({ lebar: 4000, tinggi: 3000 }, 1600)
    expect(hasil.lebar).toBe(1600)
    expect(hasil.tinggi).toBe(1200)
    // 4:3 sebelum dan sesudah — gambar tidak boleh gepeng.
    expect(hasil.lebar / hasil.tinggi).toBeCloseTo(4000 / 3000, 5)
  })

  it("potret ditangani sama seperti lanskap", () => {
    const hasil = dimensiTerskala({ lebar: 3000, tinggi: 4000 }, 1600)
    expect(hasil.tinggi).toBe(1600)
    expect(hasil.lebar).toBe(1200)
  })

  it("gambar sangat panjang tidak menghasilkan sisi 0", () => {
    // Tangkapan layar struk: rasio ekstrem. Pembulatan ke bawah akan
    // menghasilkan lebar 0 dan canvas gagal menggambar.
    const hasil = dimensiTerskala({ lebar: 20, tinggi: 20000 }, 1600)
    expect(hasil.tinggi).toBe(1600)
    expect(hasil.lebar).toBeGreaterThanOrEqual(1)
  })

  it("dimensi nol tidak membuat pembagian nol", () => {
    expect(dimensiTerskala({ lebar: 0, tinggi: 0 })).toEqual({ lebar: 0, tinggi: 0 })
  })
})

describe("periksaTipe", () => {
  it.each(["image/jpeg", "image/png", "image/webp"])("%s diterima", (t) => {
    expect(periksaTipe(t).ok).toBe(true)
  })

  it.each(["application/pdf", "image/gif", "text/plain", ""])(
    "%p ditolak sebelum berkasnya dibaca",
    (t) => {
      expect(periksaTipe(t).ok).toBe(false)
    },
  )
})

describe("periksaUkuran", () => {
  it("berkas kosong ditolak", () => {
    expect(periksaUkuran(0).ok).toBe(false)
  })

  it("tepat di batas diterima", () => {
    expect(periksaUkuran(MAKS_UKURAN_FOTO_BYTE).ok).toBe(true)
  })

  it("satu byte di atas batas ditolak, dan pesannya menyebut dua angkanya", () => {
    const hasil = periksaUkuran(MAKS_UKURAN_FOTO_BYTE + 1)
    expect(hasil.ok).toBe(false)
    if (!hasil.ok) {
      // Pesan yang hanya bilang "terlalu besar" tidak membantu petugas
      // memutuskan apa yang harus dilakukan.
      expect(hasil.pesan).toContain("1024 KB")
    }
  })

  it("batas aplikasi sama dengan batas CHECK di database", () => {
    // Kalau keduanya berbeda, pengguna melihat error 500 dari constraint
    // alih-alih pesan yang bisa dipahami.
    expect(MAKS_UKURAN_FOTO_BYTE).toBe(1_048_576)
  })
})

describe("formatUkuran", () => {
  it.each([
    [512, "512 B"],
    [2048, "2 KB"],
    [1_048_576, "1.0 MB"],
    [3_500_000, "3.3 MB"],
  ])("%i byte -> %s", (byte, teks) => {
    expect(formatUkuran(byte)).toBe(teks)
  })
})
