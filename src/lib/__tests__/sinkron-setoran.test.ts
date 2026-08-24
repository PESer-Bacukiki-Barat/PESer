/**
 * Antrean setoran offline — PRD §4.3 aturan 1–4, FR-F2/F3.
 *
 * Ini bagian paling berbahaya dari seluruh aplikasi: kesalahan di sini berarti
 * hasil timbangan yang sudah dicatat di depan warga hilang, atau setoran yang
 * sama tercatat dua kali. Keduanya tidak memunculkan error apa pun — hanya
 * angka yang salah di laporan berbulan-bulan kemudian.
 *
 * Karena itu logika sinkronisasi dibuat murni terhadap dependensinya dan diuji
 * di sini tanpa browser, tanpa IndexedDB, dan tanpa jaringan.
 */
import { RETENSI_DRAFT_HARI } from "@/lib/constants"
import {
  AntreanMemori,
  buatDraft,
  sudahKedaluwarsa,
  type DraftSetoran,
} from "@/lib/antrean-setoran"
import {
  adaPerubahan,
  klasifikasiKegagalan,
  sinkronkanAntrean,
  type HasilKirim,
  type Pengirim,
} from "@/lib/sinkron-setoran"

const SEKARANG = new Date("2026-08-24T10:00:00.000Z")

const payload = (nasabahId = "n1") => ({
  nasabahId,
  cashDibayar: true,
  items: [{ jenisSampahId: "j1", berat: 2, kondisi: "BERSIH" }],
})

const ringkasan = { nasabah: "Hasnah", totalBerat: 2, totalNilai: 6000 }

const draft = (kunci: string, umurHari = 0, ubah: Partial<DraftSetoran> = {}) => ({
  ...buatDraft(
    kunci,
    payload(),
    ringkasan,
    new Date(SEKARANG.getTime() - umurHari * 86_400_000),
  ),
  ...ubah,
})

const sukses: Pengirim = async () => ({ jenis: "sukses", id: "set1" })
const suksesReplay: Pengirim = async () => ({ jenis: "sukses", id: "set1", replay: true })
const jaringanMati: Pengirim = async () => ({
  jenis: "gagal-jaringan",
  pesan: "Terjadi kesalahan",
})
const ditolak: Pengirim = async () => ({
  jenis: "gagal-permanen",
  pesan: "Nasabah tidak ditemukan di bank sampah ini",
})

describe("klasifikasiKegagalan", () => {
  it.each([400, 403, 404, 422, 499])("status %i dianggap permanen", (status) => {
    expect(klasifikasiKegagalan(status, "x").jenis).toBe("gagal-permanen")
  })

  it.each([500, 502, 503])("status %i layak dicoba lagi", (status) => {
    expect(klasifikasiKegagalan(status, "x").jenis).toBe("gagal-jaringan")
  })

  it("tanpa status dianggap jaringan — permintaan tidak pernah sampai", () => {
    expect(klasifikasiKegagalan(undefined, "x").jenis).toBe("gagal-jaringan")
  })

  it("meneruskan pesan apa adanya supaya petugas tahu sebabnya", () => {
    expect(klasifikasiKegagalan(422, "Harga belum aktif").pesan).toBe("Harga belum aktif")
  })
})

describe("antrean: idempotencyKey sebagai primary key (§4.3 aturan 2)", () => {
  it("menyimpan kunci yang sama dua kali tidak menghasilkan dua draft", async () => {
    const store = new AntreanMemori()
    await store.simpan(draft("kunci-1"))
    await store.simpan(draft("kunci-1"))
    expect(await store.semua()).toHaveLength(1)
  })

  it("draft baru berstatus PENDING_SYNC (§4.3 aturan 1)", () => {
    expect(draft("k").status).toBe("PENDING_SYNC")
    expect(draft("k").percobaan).toBe(0)
  })

  it("urutannya kronologis, bukan urutan penyimpanan", async () => {
    const store = new AntreanMemori()
    await store.simpan(draft("baru", 0))
    await store.simpan(draft("lama", 3))
    expect((await store.semua()).map((d) => d.idempotencyKey)).toEqual(["lama", "baru"])
  })
})

describe("retensi draft", () => {
  it(`draft lebih tua dari ${RETENSI_DRAFT_HARI} hari dianggap kedaluwarsa`, () => {
    expect(sudahKedaluwarsa(draft("k", RETENSI_DRAFT_HARI + 1), SEKARANG)).toBe(true)
  })

  it("tepat di batas retensi belum kedaluwarsa", () => {
    expect(sudahKedaluwarsa(draft("k", RETENSI_DRAFT_HARI), SEKARANG)).toBe(false)
  })

  it("draft kedaluwarsa TIDAK dikirim, hanya ditandai", async () => {
    const store = new AntreanMemori([draft("tua", RETENSI_DRAFT_HARI + 2)])
    const kirim = jest.fn(sukses)
    const hasil = await sinkronkanAntrean(store, kirim, SEKARANG)

    expect(kirim).not.toHaveBeenCalled()
    expect(hasil.kedaluwarsa).toBe(1)
    const [d] = await store.semua()
    expect(d.status).toBe("KEDALUWARSA")
    expect(d.pesanGagal).toMatch(/retensi/i)
  })
})

describe("sinkronkanAntrean — berhasil", () => {
  it("antrean kosong menghasilkan nol, bukan error", async () => {
    const hasil = await sinkronkanAntrean(new AntreanMemori(), sukses, SEKARANG)
    expect(hasil).toEqual({
      terkirim: 0,
      replay: 0,
      gagalPermanen: 0,
      kedaluwarsa: 0,
      tertunda: 0,
    })
  })

  it("draft terkirim dihapus dari antrean", async () => {
    const store = new AntreanMemori([draft("k1")])
    const hasil = await sinkronkanAntrean(store, sukses, SEKARANG)
    expect(hasil.terkirim).toBe(1)
    expect(await store.semua()).toHaveLength(0)
  })

  it("mengirim seluruh draft dalam satu jalan", async () => {
    const store = new AntreanMemori([draft("k1", 2), draft("k2", 1)])
    const hasil = await sinkronkanAntrean(store, sukses, SEKARANG)
    expect(hasil.terkirim).toBe(2)
    expect(hasil.tertunda).toBe(0)
  })

  it("replay dihitung terpisah tapi tetap dianggap berhasil (§4.3 aturan 3)", async () => {
    const store = new AntreanMemori([draft("k1")])
    const hasil = await sinkronkanAntrean(store, suksesReplay, SEKARANG)
    // Server mengonfirmasi sudah pernah menerima, jadi draft memang selesai.
    expect(hasil.replay).toBe(1)
    expect(hasil.terkirim).toBe(0)
    expect(await store.semua()).toHaveLength(0)
  })

  it("mengirim dalam urutan kronologis", async () => {
    const store = new AntreanMemori([draft("baru", 0), draft("lama", 3)])
    const urutan: string[] = []
    await sinkronkanAntrean(
      store,
      async (d) => {
        urutan.push(d.idempotencyKey)
        return { jenis: "sukses" } satisfies HasilKirim
      },
      SEKARANG,
    )
    expect(urutan).toEqual(["lama", "baru"])
  })
})

describe("sinkronkanAntrean — kegagalan jaringan", () => {
  it("draft TIDAK dihapus, jadi hasil timbangan tidak hilang", async () => {
    const store = new AntreanMemori([draft("k1")])
    const hasil = await sinkronkanAntrean(store, jaringanMati, SEKARANG)
    expect(hasil.tertunda).toBe(1)
    const [d] = await store.semua()
    expect(d.status).toBe("PENDING_SYNC")
  })

  it("menaikkan penghitung percobaan", async () => {
    const store = new AntreanMemori([draft("k1")])
    await sinkronkanAntrean(store, jaringanMati, SEKARANG)
    await sinkronkanAntrean(store, jaringanMati, SEKARANG)
    expect((await store.semua())[0].percobaan).toBe(2)
  })

  it("berhenti setelah kegagalan pertama, tidak menggempur jaringan yang mati", async () => {
    const store = new AntreanMemori([draft("k1", 3), draft("k2", 2), draft("k3", 1)])
    const kirim = jest.fn(jaringanMati)
    const hasil = await sinkronkanAntrean(store, kirim, SEKARANG)
    expect(kirim).toHaveBeenCalledTimes(1)
    expect(hasil.tertunda).toBe(3)
  })

  it("draft yang sudah terkirim tetap hilang meski draft berikutnya gagal", async () => {
    const store = new AntreanMemori([draft("k1", 2), draft("k2", 1)])
    let panggilan = 0
    await sinkronkanAntrean(
      store,
      async () => {
        panggilan += 1
        return panggilan === 1
          ? ({ jenis: "sukses" } satisfies HasilKirim)
          : ({ jenis: "gagal-jaringan", pesan: "mati" } satisfies HasilKirim)
      },
      SEKARANG,
    )
    const sisa = await store.semua()
    expect(sisa.map((d) => d.idempotencyKey)).toEqual(["k2"])
  })
})

describe("sinkronkanAntrean — ditolak server", () => {
  it("ditandai GAGAL beserta alasannya, tidak dihapus diam-diam", async () => {
    const store = new AntreanMemori([draft("k1")])
    const hasil = await sinkronkanAntrean(store, ditolak, SEKARANG)
    expect(hasil.gagalPermanen).toBe(1)
    const [d] = await store.semua()
    expect(d.status).toBe("GAGAL")
    expect(d.pesanGagal).toContain("Nasabah tidak ditemukan")
  })

  it("penolakan satu draft tidak menghentikan draft lain", async () => {
    const store = new AntreanMemori([draft("k1", 2), draft("k2", 1)])
    const kirim = jest.fn(async (d: DraftSetoran) =>
      d.idempotencyKey === "k1"
        ? ({ jenis: "gagal-permanen", pesan: "ditolak" } satisfies HasilKirim)
        : ({ jenis: "sukses" } satisfies HasilKirim),
    )
    const hasil = await sinkronkanAntrean(store, kirim, SEKARANG)
    expect(kirim).toHaveBeenCalledTimes(2)
    expect(hasil.gagalPermanen).toBe(1)
    expect(hasil.terkirim).toBe(1)
  })

  it("draft GAGAL tidak dicoba ulang otomatis", async () => {
    const store = new AntreanMemori([draft("k1", 0, { status: "GAGAL" })])
    const kirim = jest.fn(sukses)
    const hasil = await sinkronkanAntrean(store, kirim, SEKARANG)
    expect(kirim).not.toHaveBeenCalled()
    expect(hasil.tertunda).toBe(0)
  })

  it("draft KEDALUWARSA juga tidak dicoba ulang otomatis", async () => {
    const store = new AntreanMemori([draft("k1", 0, { status: "KEDALUWARSA" })])
    const kirim = jest.fn(sukses)
    await sinkronkanAntrean(store, kirim, SEKARANG)
    expect(kirim).not.toHaveBeenCalled()
  })
})

describe("adaPerubahan", () => {
  const kosong = {
    terkirim: 0,
    replay: 0,
    gagalPermanen: 0,
    kedaluwarsa: 0,
    tertunda: 0,
  }

  it("true kalau ada yang terkirim atau replay", () => {
    expect(adaPerubahan({ ...kosong, terkirim: 1 })).toBe(true)
    expect(adaPerubahan({ ...kosong, replay: 1 })).toBe(true)
  })

  it("false kalau hanya gagal atau kedaluwarsa — data server tidak berubah", () => {
    expect(adaPerubahan({ ...kosong, gagalPermanen: 2 })).toBe(false)
    expect(adaPerubahan({ ...kosong, kedaluwarsa: 1, tertunda: 3 })).toBe(false)
  })
})
