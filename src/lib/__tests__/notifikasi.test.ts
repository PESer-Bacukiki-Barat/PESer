/**
 * Notifikasi in-app — FR-E5.
 *
 * Dua hal yang dijaga di sini tidak terlihat dari status HTTP:
 *
 * 1. Notifikasi hanya dikirim saat stock MELEWATI ambang, bukan setiap kali
 *    berada di atasnya. PRD §8 (baris 1028) mencatat risikonya sebagai
 *    "notifikasi kebanyakan/never" — tanpa syarat itu, setiap setoran
 *    berikutnya di gudang penuh mengirim notifikasi baru dan admin berhenti
 *    membacanya.
 * 2. Penerimanya diselesaikan saat penulisan: semua ADMIN aktif untuk stock,
 *    dan hanya PETUGAS bank sampah yang bersangkutan untuk dispatch — definisi
 *    "PETUGAS pemilik" di PRD §6.
 */
import {
  melewatiThreshold,
  notifStockThreshold,
  notifDispatchMasuk,
} from "@/lib/notifikasi"

type TxPalsu = {
  user: { findMany: jest.Mock }
  notifikasi: { createMany: jest.Mock }
}

const buatTx = (pengguna: { id: string }[]): TxPalsu => ({
  user: { findMany: jest.fn().mockResolvedValue(pengguna) },
  notifikasi: { createMany: jest.fn().mockResolvedValue({ count: pengguna.length }) },
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const asTx = (tx: TxPalsu) => tx as any

describe("melewatiThreshold", () => {
  it("naik melewati ambang → true", () => {
    expect(melewatiThreshold({ sebelum: 90, sesudah: 105, threshold: 100 })).toBe(true)
  })

  it("tepat menyentuh ambang sudah dihitung melewati (batas inklusif)", () => {
    expect(melewatiThreshold({ sebelum: 90, sesudah: 100, threshold: 100 })).toBe(true)
  })

  it("SUDAH di atas ambang lalu bertambah lagi → false, ini inti anti-kebisingan", () => {
    expect(melewatiThreshold({ sebelum: 120, sesudah: 140, threshold: 100 })).toBe(false)
  })

  it("naik tapi belum sampai ambang → false", () => {
    expect(melewatiThreshold({ sebelum: 10, sesudah: 99.99, threshold: 100 })).toBe(false)
  })

  it("ambang 0 berarti belum diatur, bukan selalu terlewati", () => {
    // Aturan yang sama dengan peta (src/lib/level-stock.ts): tanpa ini setiap
    // setoran pertama di jenis mana pun akan memberi tahu seluruh admin.
    expect(melewatiThreshold({ sebelum: 0, sesudah: 5, threshold: 0 })).toBe(false)
    expect(melewatiThreshold({ sebelum: 0, sesudah: 5, threshold: -1 })).toBe(false)
  })
})

describe("notifStockThreshold", () => {
  it("menulis satu baris untuk SETIAP admin aktif", async () => {
    const tx = buatTx([{ id: "a1" }, { id: "a2" }])
    const jumlah = await notifStockThreshold(asTx(tx), {
      bankSampahId: "bs1",
      namaBankSampah: "BS Mawar",
      namaJenis: "Botol PET Bening",
      berat: 120.5,
      threshold: 100,
    })

    expect(jumlah).toBe(2)
    const baris = tx.notifikasi.createMany.mock.calls[0][0].data
    expect(baris).toHaveLength(2)
    expect(baris.map((b: { userId: string }) => b.userId)).toEqual(["a1", "a2"])
    expect(baris[0]).toMatchObject({
      tipe: "STOCK_THRESHOLD",
      bankSampahId: "bs1",
      tautan: "/admin/peta",
    })
    expect(baris[0].judul).toContain("BS Mawar")
    expect(baris[0].pesan).toContain("Botol PET Bening")
  })

  it("hanya ADMIN yang aktif dan belum dihapus", async () => {
    const tx = buatTx([{ id: "a1" }])
    await notifStockThreshold(asTx(tx), {
      bankSampahId: "bs1",
      namaBankSampah: "BS Mawar",
      namaJenis: "Kardus",
      berat: 60,
      threshold: 50,
    })
    expect(tx.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { role: "ADMIN", isActive: true, deletedAt: null },
      }),
    )
  })

  it("tanpa admin, tidak menulis baris kosong", async () => {
    const tx = buatTx([])
    const jumlah = await notifStockThreshold(asTx(tx), {
      bankSampahId: "bs1",
      namaBankSampah: "BS Mawar",
      namaJenis: "Kardus",
      berat: 60,
      threshold: 50,
    })
    expect(jumlah).toBe(0)
    expect(tx.notifikasi.createMany).not.toHaveBeenCalled()
  })
})

describe("notifDispatchMasuk", () => {
  it("hanya petugas bank sampah itu — definisi PETUGAS pemilik (§6)", async () => {
    const tx = buatTx([{ id: "p1" }])
    await notifDispatchMasuk(asTx(tx), {
      bankSampahId: "bs-tertentu",
      dispatchId: "d1",
      kodeDispatch: "DSP-202608-001",
    })

    expect(tx.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          role: "PETUGAS",
          bankSampahId: "bs-tertentu",
          isActive: true,
          deletedAt: null,
        },
      }),
    )
  })

  it("tautannya menuju detail dispatch di area petugas", async () => {
    const tx = buatTx([{ id: "p1" }, { id: "p2" }])
    const jumlah = await notifDispatchMasuk(asTx(tx), {
      bankSampahId: "bs1",
      dispatchId: "d1",
      kodeDispatch: "DSP-202608-001",
    })

    expect(jumlah).toBe(2)
    const baris = tx.notifikasi.createMany.mock.calls[0][0].data
    expect(baris[0]).toMatchObject({
      tipe: "DISPATCH_MASUK",
      tautan: "/petugas/dispatch/d1",
      bankSampahId: "bs1",
    })
    expect(baris[0].judul).toContain("DSP-202608-001")
  })

  it("bank sampah tanpa petugas tidak menghasilkan apa-apa", async () => {
    const tx = buatTx([])
    expect(
      await notifDispatchMasuk(asTx(tx), {
        bankSampahId: "bs-kosong",
        dispatchId: "d1",
        kodeDispatch: "DSP-1",
      }),
    ).toBe(0)
    expect(tx.notifikasi.createMany).not.toHaveBeenCalled()
  })
})
