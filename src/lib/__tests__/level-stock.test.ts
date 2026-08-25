import {
  GAYA_LEVEL,
  URUTAN_LEVEL,
  levelStock,
  pusatPeta,
  type LevelStock,
} from "@/lib/level-stock"

describe("levelStock", () => {
  it("berat 0 selalu KOSONG, apa pun ambangnya", () => {
    expect(levelStock({ berat: 0, threshold: 0 })).toBe("KOSONG")
    expect(levelStock({ berat: 0, threshold: 100 })).toBe("KOSONG")
  })

  /**
   * Inti FR-E2. `berat >= threshold` secara naif membuat gudang kosong
   * (0 kg, ambang 0) lulus sebagai "siap jemput" dan mengirim armada ke
   * tempat yang tidak ada isinya. Dua tes berikut mengunci penanganan itu.
   */
  it("ambang 0 berarti belum diatur, bukan sudah terlewati", () => {
    expect(levelStock({ berat: 12.5, threshold: 0 })).toBe("TERISI")
  })

  it("gudang kosong tanpa ambang tidak pernah SIAP_JEMPUT", () => {
    expect(levelStock({ berat: 0, threshold: 0 })).not.toBe("SIAP_JEMPUT")
  })

  it("ambang negatif diperlakukan sama dengan belum diatur", () => {
    expect(levelStock({ berat: 5, threshold: -1 })).toBe("TERISI")
  })

  it("di bawah ambang → NORMAL", () => {
    expect(levelStock({ berat: 99.99, threshold: 100 })).toBe("NORMAL")
  })

  it("tepat di ambang sudah SIAP_JEMPUT (batasnya inklusif)", () => {
    expect(levelStock({ berat: 100, threshold: 100 })).toBe("SIAP_JEMPUT")
  })

  it("melewati ambang → SIAP_JEMPUT", () => {
    expect(levelStock({ berat: 246.45, threshold: 100 })).toBe("SIAP_JEMPUT")
  })

  it("berat negatif — mustahil menurut BR-07, tetap tidak boleh SIAP_JEMPUT", () => {
    expect(levelStock({ berat: -3, threshold: 1 })).toBe("KOSONG")
  })
})

describe("GAYA_LEVEL / URUTAN_LEVEL", () => {
  const semua: LevelStock[] = ["KOSONG", "TERISI", "NORMAL", "SIAP_JEMPUT"]

  it("setiap level punya gaya, jadi legenda tidak pernah undefined", () => {
    for (const level of semua) {
      expect(GAYA_LEVEL[level]).toBeDefined()
      expect(GAYA_LEVEL[level].label).not.toHaveLength(0)
      expect(GAYA_LEVEL[level].keterangan).not.toHaveLength(0)
    }
  })

  it("warna memakai CSS variable tema, bukan hex yang ditulis ulang", () => {
    for (const level of semua) {
      expect(GAYA_LEVEL[level].warna).toMatch(/^var\(--color-/)
    }
  })

  it("URUTAN_LEVEL memuat semua level tepat sekali", () => {
    expect([...URUTAN_LEVEL].sort()).toEqual([...semua].sort())
  })

  it("SIAP_JEMPUT tampil paling dulu — yang paling butuh tindakan", () => {
    expect(URUTAN_LEVEL[0]).toBe("SIAP_JEMPUT")
  })
})

describe("pusatPeta", () => {
  it("null kalau tidak ada marker, supaya pemanggil bisa pakai cadangan", () => {
    expect(pusatPeta([])).toBeNull()
  })

  it("satu marker → koordinatnya sendiri", () => {
    expect(pusatPeta([{ latitude: -4.01, longitude: 119.62 }])).toEqual([-4.01, 119.62])
  })

  it("beberapa marker → rata-rata koordinat", () => {
    expect(
      pusatPeta([
        { latitude: -4, longitude: 119 },
        { latitude: -6, longitude: 121 },
      ]),
    ).toEqual([-5, 120])
  })
})
