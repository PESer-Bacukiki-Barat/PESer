/**
 * Penautan akun → Nasabah untuk area warga.
 *
 * Regresi utama yang dijaga di sini: sebelumnya tiap halaman menulis
 * `...(user.noHp ? { noHp: user.noHp } : {})`, yang MENGHAPUS filter ketika
 * nomor HP kosong. findFirst lalu mengembalikan nasabah pertama di bank sampah
 * itu, jadi akun tanpa nomor HP tampil sebagai orang lain — membaca riwayat
 * setorannya, bahkan menyetor atas namanya. Tes "TANPA_NOHP" dan "GANDA" ada
 * supaya perilaku itu tidak bisa kembali tanpa membuat suite ini merah.
 */
import { prisma } from "@/lib/prisma"
import { nasabahTertaut } from "@/lib/nasabah-tertaut"
import { normalkanNoHp } from "@/lib/no-hp"

jest.mock("@/lib/prisma", () => ({
  prisma: { nasabah: { findMany: jest.fn() } },
}))

const mPrisma = prisma as unknown as { nasabah: { findMany: jest.Mock } }

const baris = (over: Partial<{ id: string; nama: string; kodeNasabah: string; isActive: boolean; noHp: string | null }> = {}) => ({
  id: "n1",
  nama: "Hasnah",
  kodeNasabah: "NSB-001",
  isActive: true,
  noHp: "081234500001",
  ...over,
})

beforeEach(() => {
  mPrisma.nasabah.findMany.mockResolvedValue([])
})

describe("normalkanNoHp", () => {
  it.each([
    ["081234500001", "081234500001"],
    ["0812-3450-0001", "081234500001"],
    ["0812 3450 0001", "081234500001"],
    ["+62 812 3450 0001", "081234500001"],
    ["6281234500001", "081234500001"],
    ["81234500001", "081234500001"],
  ])("%s → %s", (masuk, keluar) => {
    expect(normalkanNoHp(masuk)).toBe(keluar)
  })

  it.each([null, undefined, "", "-", "0", "12345", "abc"])(
    "%p bukan nomor yang bisa mengidentifikasi siapa pun → null",
    (masuk) => {
      expect(normalkanNoHp(masuk as string | null)).toBeNull()
    },
  )

  it("dua format berbeda untuk nomor yang sama menghasilkan kunci yang sama", () => {
    expect(normalkanNoHp("+62 812-3450-0001")).toBe(normalkanNoHp("081234500001"))
  })
})

describe("nasabahTertaut", () => {
  it("akun tanpa noHp TIDAK pernah menghasilkan nasabah — bahkan kalau ada isinya", async () => {
    const hasil = await nasabahTertaut({ noHp: null, bankSampahId: "bs1" })
    expect(hasil).toEqual({ status: "TANPA_NOHP" })
    // Tidak menyentuh database sama sekali: tidak ada yang bisa dicocokkan.
    expect(mPrisma.nasabah.findMany).not.toHaveBeenCalled()
  })

  it("noHp yang terlalu pendek diperlakukan seperti kosong, bukan dicocokkan", async () => {
    const hasil = await nasabahTertaut({ noHp: "-", bankSampahId: "bs1" })
    expect(hasil).toEqual({ status: "TANPA_NOHP" })
    expect(mPrisma.nasabah.findMany).not.toHaveBeenCalled()
  })

  it("nomor terisi tapi tidak ada nasabahnya → TIDAK_DITEMUKAN", async () => {
    mPrisma.nasabah.findMany.mockResolvedValue([baris({ noHp: "081299999999" })])
    const hasil = await nasabahTertaut({ noHp: "081234500001", bankSampahId: "bs1" })
    expect(hasil).toEqual({ status: "TIDAK_DITEMUKAN", noHp: "081234500001" })
  })

  it("tepat satu cocok → TERTAUT", async () => {
    mPrisma.nasabah.findMany.mockResolvedValue([
      baris({ id: "lain", noHp: "081299999999" }),
      baris(),
    ])
    const hasil = await nasabahTertaut({ noHp: "081234500001", bankSampahId: "bs1" })
    expect(hasil).toEqual({
      status: "TERTAUT",
      nasabah: { id: "n1", nama: "Hasnah", kodeNasabah: "NSB-001", isActive: true },
    })
  })

  it("cocok meski format nomornya berbeda di kedua sisi", async () => {
    mPrisma.nasabah.findMany.mockResolvedValue([baris({ noHp: "0812-3450-0001" })])
    const hasil = await nasabahTertaut({
      noHp: "+62 812 3450 0001",
      bankSampahId: "bs1",
    })
    expect(hasil.status).toBe("TERTAUT")
  })

  it("dua nasabah bernomor sama → GANDA, bukan diambil salah satu", async () => {
    mPrisma.nasabah.findMany.mockResolvedValue([
      baris({ id: "n1", kodeNasabah: "NSB-001" }),
      baris({ id: "n2", kodeNasabah: "NSB-007", nama: "Hasnah B" }),
    ])
    const hasil = await nasabahTertaut({ noHp: "081234500001", bankSampahId: "bs1" })
    expect(hasil).toEqual({ status: "GANDA", noHp: "081234500001", jumlah: 2 })
  })

  it("nasabah nonaktif tetap tertaut, statusnya diteruskan ke pemanggil", async () => {
    mPrisma.nasabah.findMany.mockResolvedValue([baris({ isActive: false })])
    const hasil = await nasabahTertaut({ noHp: "081234500001", bankSampahId: "bs1" })
    expect(hasil).toMatchObject({ status: "TERTAUT" })
    if (hasil.status === "TERTAUT") expect(hasil.nasabah.isActive).toBe(false)
  })

  it("kandidat dibatasi bank sampah akun dan mengecualikan soft-delete", async () => {
    await nasabahTertaut({ noHp: "081234500001", bankSampahId: "bs-tertentu" })
    expect(mPrisma.nasabah.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          bankSampahId: "bs-tertentu",
          deletedAt: null,
          noHp: { not: null },
        }),
      }),
    )
  })
})
