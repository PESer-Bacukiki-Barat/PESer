import { prisma } from "@/lib/prisma"
import type { Prisma } from "@/generated/prisma/client"

/**
 * Penulisan AuditLog — PRD §2.5 aturan 2 [WAJIB]:
 * "Setiap endpoint tulis wajib menulis AuditLog dalam transaksi yang sama."
 *
 * Karena itu helper ini menerima client transaksi, bukan prisma global:
 * memanggilnya di luar $transaction akan membuat audit bisa tertulis
 * walaupun operasi utamanya gagal — dan itu justru merusak ketertelusuran.
 */

export type OperasiAudit = "BUAT" | "UBAH" | "HAPUS"

/** Field yang tidak boleh ikut tersimpan di audit (PRD §5.3 larangan). */
const FIELD_RAHASIA = new Set(["password", "passwordHash", "idempotencyKey"])

/**
 * Nama aksi mengikuti konvensi yang sudah dipakai kode lain
 * (BUAT_SETORAN, HAPUS_DISPATCH): OPERASI_ENTITAS_SNAKE_UPPER.
 */
export function aksiAudit(operasi: OperasiAudit, entitas: string): string {
  const slug = entitas.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toUpperCase()
  return `${operasi}_${slug}`
}

/**
 * Siapkan payload untuk kolom Json: buang field rahasia secara rekursif dan
 * ubah Decimal/Date menjadi bentuk yang bisa diserialisasi.
 */
export function bersihkanPayload(nilai: unknown): Prisma.InputJsonValue {
  const polos = JSON.parse(JSON.stringify(nilai ?? null))
  return sensor(polos) as Prisma.InputJsonValue
}

function sensor(nilai: unknown): unknown {
  if (Array.isArray(nilai)) return nilai.map(sensor)
  if (nilai && typeof nilai === "object") {
    const keluar: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(nilai as Record<string, unknown>)) {
      keluar[k] = FIELD_RAHASIA.has(k) ? "[disensor]" : sensor(v)
    }
    return keluar
  }
  return nilai
}

export type AuditInput = {
  operasi: OperasiAudit
  /** Nama model Prisma, mis. "Kelurahan", "BankSampah". */
  entitas: string
  entitasId: string
  userId: string
  /** Keadaan sebelum operasi — wajib untuk UBAH dan HAPUS. */
  before?: unknown
  /** Keadaan sesudah operasi — wajib untuk BUAT dan UBAH. */
  after?: unknown
}

/**
 * Jalankan satu operasi tulis beserta AuditLog-nya dalam SATU transaksi.
 *
 * Dipakai supaya 19 handler master data tidak perlu masing-masing membuka
 * $transaction dan menyusun ulang try/catch-nya: error apa pun dari dalam
 * tetap dilempar ke luar, sehingga penanganan P2002/P2025 yang sudah ada di
 * tiap route tetap berlaku dan status HTTP-nya tidak berubah.
 *
 * `bacaSebelum` dipakai untuk UBAH/HAPUS. Kalau barisnya tidak ada, operasi
 * utamanya sendiri yang akan melempar (P2025) dan transaksi di-rollback —
 * jadi tidak perlu pengecekan tambahan di sini.
 */
export async function denganAudit<T extends { id: string }>(
  meta: { operasi: OperasiAudit; entitas: string; userId: string },
  jalankan: (tx: Prisma.TransactionClient) => Promise<T>,
  bacaSebelum?: (tx: Prisma.TransactionClient) => Promise<unknown>,
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    const before = bacaSebelum ? await bacaSebelum(tx) : undefined
    const hasil = await jalankan(tx)
    await tulisAudit(tx, {
      ...meta,
      entitasId: hasil.id,
      ...(before !== undefined ? { before } : {}),
      after: hasil,
    })
    return hasil
  })
}

export async function tulisAudit(
  tx: Prisma.TransactionClient,
  { operasi, entitas, entitasId, userId, before, after }: AuditInput,
): Promise<void> {
  await tx.auditLog.create({
    data: {
      userId,
      aksi: aksiAudit(operasi, entitas),
      entitas,
      entitasId,
      // Kolom Json? menolak null literal, jadi field yang tidak relevan
      // sengaja tidak di-set supaya tersimpan NULL.
      ...(before !== undefined ? { payloadBefore: bersihkanPayload(before) } : {}),
      ...(after !== undefined ? { payloadAfter: bersihkanPayload(after) } : {}),
    },
  })
}
