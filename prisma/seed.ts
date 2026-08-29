import "dotenv/config"
import bcrypt from "bcryptjs"

import { prisma } from "@/lib/prisma"
import { Prisma } from "@/generated/prisma/client"
import { denganAudit } from "@/lib/audit"
import {
  BANK_SAMPAH,
  JENIS_SAMPAH,
  KELURAHAN,
  NASABAH,
  PEMBELI,
  SETORAN,
  THRESHOLD,
  USER,
  ringkasanSeed,
} from "@/lib/seed-data"

/**
 * Seed database — data awal yang membuat aplikasi bisa langsung dipakai dan
 * didemokan tanpa menyiapkan apa pun lewat UI.
 *
 * Tiga sifat yang dijaga:
 *
 * 1. IDEMPOTEN. Semua tulis memakai upsert atas kunci alami (kodeWilayah, kode
 *    jenis, kodeNasabah, email) dan setoran memakai idempotencyKey yang tetap.
 *    Menjalankannya dua kali tidak menduplikasi apa pun.
 * 2. TIDAK MERUSAK. Tidak ada delete di sini. Baris yang sudah ada diperbarui,
 *    baris lain (termasuk data uji milik siapa pun) dibiarkan.
 * 3. PATUH ATURAN. Stock tidak pernah di-set langsung: ia terbentuk dari
 *    setoran, di transaksi yang juga menulis StockMutation dan AuditLog —
 *    larangan §8.7 dan §2.5 aturan 2 berlaku untuk seed juga, bukan hanya untuk
 *    handler API. Harga di-snapshot dari master saat menulis (BR-09).
 *
 * Datanya sendiri ada di src/lib/seed-data.ts, dan invariannya (BR-01, BR-02,
 * BR-16, keutuhan acuan, cakupan level peta) diuji di
 * src/lib/__tests__/seed-data.test.ts tanpa database.
 */

const emailAdmin = process.env.SEED_ADMIN_EMAIL ?? "admin@peser.local"
const passwordAdmin = process.env.SEED_ADMIN_PASSWORD ?? "admin123"
const passwordPetugas = process.env.SEED_PETUGAS_PASSWORD ?? "petugas123"

const rp = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n)

const kg = (n: number) =>
  new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(n)

/**
 * Satu baris SetoranItem yang sudah dihitung. Ditulis eksplisit, bukan memakai
 * tipe generated Prisma: bentuk `*CreateWithout*Input` menolak FK skalar
 * (menuntut relasi bersarang), padahal di sini justru id-nya yang sudah ada.
 */
type RincianSeed = {
  jenisSampahId: string
  kondisi: "BERSIH" | "KOTOR" | "CAMPUR"
  berat: Prisma.Decimal
  hargaSaatItu: Prisma.Decimal
  subtotal: Prisma.Decimal
}

async function main() {
  const dibuat = { baru: 0, dilewati: 0 }

  // --- Kelurahan (BR-01: satu kelurahan tepat satu bank sampah) -------------
  const kelurahanId = new Map<string, string>()
  for (const k of KELURAHAN) {
    const row = await prisma.kelurahan.upsert({
      where: { kodeWilayah: k.kodeWilayah },
      update: { nama: k.nama, deletedAt: null },
      create: k,
      select: { id: true },
    })
    kelurahanId.set(k.kodeWilayah, row.id)
  }
  console.log(`Kelurahan: ${KELURAHAN.length}`)

  // --- Bank sampah ---------------------------------------------------------
  const bankSampahId = new Map<string, string>()
  for (const b of BANK_SAMPAH) {
    const data = {
      nama: b.nama,
      alamat: b.alamat,
      latitude: new Prisma.Decimal(b.latitude),
      longitude: new Prisma.Decimal(b.longitude),
      isActive: b.isActive,
      kelurahanId: kelurahanId.get(b.kodeWilayah)!,
    }
    const row = await prisma.bankSampah.upsert({
      // kelurahanId @unique menegakkan BR-01 di level database, jadi ia juga
      // kunci upsert yang paling tepat di sini.
      where: { kelurahanId: data.kelurahanId },
      update: { ...data, deletedAt: null },
      create: data,
      select: { id: true },
    })
    bankSampahId.set(b.nama, row.id)
  }
  console.log(`Bank sampah: ${BANK_SAMPAH.length}`)

  // --- Jenis sampah + harga (FR-B4/B5) -------------------------------------
  const jenisId = new Map<number, string>()
  for (const j of JENIS_SAMPAH) {
    const row = await prisma.jenisSampah.upsert({
      where: { kode: j.kode },
      update: {
        nama: j.nama,
        kategori: j.kategori,
        satuan: j.satuan,
        harga: new Prisma.Decimal(j.harga),
        isActive: j.isActive,
        deletedAt: null,
      },
      create: { ...j, harga: new Prisma.Decimal(j.harga) },
      select: { id: true },
    })
    jenisId.set(j.kode, row.id)
  }
  console.log(`Jenis sampah: ${JENIS_SAMPAH.length}`)

  // --- Pembeli -------------------------------------------------------------
  // Pembeli tidak punya kolom unique di skema, jadi upsert tidak bisa dipakai;
  // dicocokkan atas nama, yang di data seed sudah dijamin unik oleh tesnya.
  for (const p of PEMBELI) {
    const ada = await prisma.pembeli.findFirst({
      where: { nama: p.nama },
      select: { id: true },
    })
    if (ada) {
      await prisma.pembeli.update({ where: { id: ada.id }, data: { ...p, deletedAt: null } })
    } else {
      await prisma.pembeli.create({ data: p })
    }
  }
  console.log(`Pembeli: ${PEMBELI.length}`)

  // --- Nasabah (FR-B7) -----------------------------------------------------
  const nasabahId = new Map<string, string>()
  for (const n of NASABAH) {
    const data = {
      nama: n.nama,
      noHp: n.noHp,
      alamat: n.alamat,
      rt: n.rt,
      rw: n.rw,
      bankSampahId: bankSampahId.get(n.bankSampah)!,
      isActive: true,
    }
    const row = await prisma.nasabah.upsert({
      where: { kodeNasabah: n.kodeNasabah },
      update: { ...data, deletedAt: null },
      create: { ...data, kodeNasabah: n.kodeNasabah },
      select: { id: true },
    })
    nasabahId.set(n.kodeNasabah, row.id)
  }
  console.log(`Nasabah: ${NASABAH.length}`)

  // --- Akun (FR-B3) --------------------------------------------------------
  const userId = new Map<string, string>()
  for (const u of USER) {
    const email = u.email === "admin@peser.local" ? emailAdmin : u.email
    const password = u.role === "ADMIN" ? passwordAdmin : passwordPetugas
    const passwordHash = await bcrypt.hash(password, 10)

    const data = {
      nama: u.nama,
      role: u.role,
      noHp: u.noHp,
      bankSampahId: u.bankSampah ? bankSampahId.get(u.bankSampah)! : null,
      isActive: true,
    }
    const row = await prisma.user.upsert({
      where: { email },
      // Password ikut diperbarui supaya seed selalu menjadi sumber kebenaran
      // kredensial demo — kalau tidak, akun lama dengan password terlupa akan
      // tetap tidak bisa dimasuki meski seed sudah dijalankan ulang.
      update: {
        ...data,
        deletedAt: null,
        credential: {
          upsert: {
            create: { email, passwordHash },
            update: { email, passwordHash, deletedAt: null },
          },
        },
      },
      create: { ...data, email, credential: { create: { email, passwordHash } } },
      select: { id: true },
    })
    userId.set(u.email, row.id)
  }
  console.log(`Akun: ${USER.length}`)

  // --- Setoran + Stock + StockMutation + AuditLog (satu transaksi per setoran)
  for (const s of SETORAN) {
    const sudahAda = await prisma.setoran.findUnique({
      where: { idempotencyKey: s.kunci },
      select: { id: true },
    })
    if (sudahAda) {
      dibuat.dilewati++
      continue
    }

    const tanggal = new Date()
    tanggal.setDate(tanggal.getDate() - s.hariLalu)
    tanggal.setHours(9, 0, 0, 0)

    const bsId = bankSampahId.get(s.bankSampah)!
    const petugasId = userId.get(s.petugas)!

    // BR-09: harga di-snapshot dari master, dibaca dari database (bukan dari
    // konstanta di berkas ini) supaya angkanya persis sama dengan yang dipakai
    // POST /api/setoran.
    const rincian: RincianSeed[] = []
    for (const item of s.items) {
      const jenis = await prisma.jenisSampah.findUniqueOrThrow({
        where: { id: jenisId.get(item.jenis)! },
        select: { id: true, harga: true },
      })
      const berat = new Prisma.Decimal(item.berat)
      rincian.push({
        jenisSampahId: jenis.id,
        kondisi: item.kondisi,
        berat,
        hargaSaatItu: jenis.harga,
        subtotal: berat.mul(jenis.harga),
      })
    }

    const totalBerat = rincian.reduce((a, r) => a.add(r.berat), new Prisma.Decimal(0))
    const totalNilai = rincian.reduce((a, r) => a.add(r.subtotal), new Prisma.Decimal(0))

    await denganAudit(
      { operasi: "BUAT", entitas: "Setoran", userId: petugasId },
      async (tx) => {
        // Format kode mengikuti POST /api/setoran: nomor urut dihitung atas
        // seluruh kode berprefiks bulan yang sama, karena kodeTransaksi unik
        // global — bukan per bank sampah.
        const bulan = `${tanggal.getFullYear()}${String(tanggal.getMonth() + 1).padStart(2, "0")}`
        const urutan = await tx.setoran.count({
          where: { kodeTransaksi: { startsWith: `SET-${bulan}-` } },
        })

        const setoran = await tx.setoran.create({
          data: {
            kodeTransaksi: `SET-${bulan}-${String(urutan + 1).padStart(3, "0")}`,
            bankSampahId: bsId,
            nasabahId: nasabahId.get(s.nasabah)!,
            petugasId,
            totalBerat,
            totalNilai,
            cashDibayar: true,
            tanggal,
            idempotencyKey: s.kunci,
            items: { create: rincian },
            // BR-18: penolakan ditulis di transaksi yang sama, dan sengaja
            // TIDAK menyentuh Stock — barangnya dikembalikan ke warga.
            ditolak: {
              create: (s.ditolak ?? []).map((d) => ({
                deskripsi: d.deskripsi,
                berat: new Prisma.Decimal(d.berat),
                alasan: d.alasan,
                catatan: d.catatan ?? null,
              })),
            },
          },
          select: { id: true, kodeTransaksi: true },
        })

        for (const r of rincian) {
          const lama = await tx.stock.findUnique({
            where: {
              bankSampahId_jenisSampahId: {
                bankSampahId: bsId,
                jenisSampahId: r.jenisSampahId,
              },
            },
            select: { id: true, berat: true },
          })
          const beratSebelum = lama?.berat ?? new Prisma.Decimal(0)
          const beratSesudah = beratSebelum.add(r.berat)

          const stock = lama
            ? await tx.stock.update({
                where: { id: lama.id },
                data: { berat: beratSesudah },
                select: { id: true },
              })
            : await tx.stock.create({
                data: {
                  bankSampahId: bsId,
                  jenisSampahId: r.jenisSampahId,
                  berat: beratSesudah,
                },
                select: { id: true },
              })

          // §8.7: Stock tidak pernah berubah tanpa StockMutation pendampingnya.
          await tx.stockMutation.create({
            data: {
              stockId: stock.id,
              tipe: "MASUK",
              berat: r.berat,
              beratSebelum,
              beratSesudah,
              refType: "SETORAN",
              refId: setoran.id,
              userId: petugasId,
              keterangan: `Setoran ${setoran.kodeTransaksi} (seed)`,
            },
          })
        }

        return setoran
      },
    )
    dibuat.baru++
  }
  console.log(`Setoran: ${dibuat.baru} baru, ${dibuat.dilewati} sudah ada`)

  // --- Ambang jemput -------------------------------------------------------
  // Hanya kolom threshold yang disentuh, bukan berat, jadi tidak ada pergerakan
  // stock yang perlu didampingi StockMutation. Barisnya sudah pasti ada karena
  // setoran di atas yang membentuknya.
  let ambangDiset = 0
  for (const t of THRESHOLD) {
    const kunci = {
      bankSampahId_jenisSampahId: {
        bankSampahId: bankSampahId.get(t.bankSampah)!,
        jenisSampahId: jenisId.get(t.jenis)!,
      },
    }
    const ada = await prisma.stock.findUnique({ where: kunci, select: { id: true } })
    if (!ada) {
      console.warn(
        `  ! Ambang dilewati: ${t.bankSampah} / jenis ${t.jenis} belum punya stock`,
      )
      continue
    }
    await prisma.stock.update({
      where: kunci,
      data: { threshold: new Prisma.Decimal(t.threshold) },
    })
    ambangDiset++
  }
  console.log(`Ambang jemput: ${ambangDiset}`)

  await laporkan()
}

/**
 * Laporan hasil, dibaca dari DATABASE — bukan dari data seed.
 *
 * Bedanya penting: kalau database sudah berisi data lain (misalnya sisa
 * percobaan manual), levelnya bisa berbeda dari rencana. Melaporkan angka
 * sebenarnya membuat perbedaan itu terlihat, bukan tertutupi klaim "seed
 * berhasil".
 */
async function laporkan() {
  const rencana = new Map(ringkasanSeed().map((r) => [r.bankSampah, r]))

  const bank = await prisma.bankSampah.findMany({
    where: { deletedAt: null },
    orderBy: { nama: "asc" },
    select: {
      nama: true,
      isActive: true,
      stock: { select: { berat: true, threshold: true } },
    },
  })

  console.log("\nLevel stock per bank sampah (dibaca dari database):")
  let samaSemua = true
  for (const b of bank) {
    const berat = b.stock.reduce((a, s) => a + Number(s.berat), 0)
    const threshold = b.stock.reduce((a, s) => a + Number(s.threshold), 0)
    const { levelStock } = await import("@/lib/level-stock")
    const level = levelStock({ berat, threshold })

    const r = rencana.get(b.nama)
    const cocok = r ? r.level === level : null
    if (cocok === false) samaSemua = false

    const tanda = cocok === null ? "?" : cocok ? "OK" : "BEDA"
    console.log(
      `  [${tanda}] ${b.nama.padEnd(12)} ${kg(berat).padStart(8)} kg / ambang ${kg(threshold).padStart(6)} kg -> ${level}${b.isActive ? "" : " (non-aktif)"}`,
    )
  }
  if (!samaSemua) {
    console.log(
      "\n  Catatan: ada bank sampah yang levelnya berbeda dari rencana seed.\n" +
        "  Itu normal kalau database sudah berisi setoran lain di luar seed.\n" +
        "  Untuk database yang persis sesuai rencana, mulai dari database bersih.",
    )
  }

  const total = await prisma.setoran.aggregate({ _sum: { totalNilai: true }, _count: true })
  console.log(
    `\nSetoran tercatat: ${total._count} transaksi, total ${rp(Number(total._sum.totalNilai ?? 0))}`,
  )

  console.log("\nLogin:")
  console.log(`  admin   ${emailAdmin} / ${passwordAdmin}`)
  for (const u of USER.filter((x) => x.role === "PETUGAS")) {
    const tautan = u.noHp ? ` (tertaut nasabah lewat noHp ${u.noHp})` : ""
    console.log(`  petugas ${u.email} / ${passwordPetugas} - ${u.bankSampah}${tautan}`)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
