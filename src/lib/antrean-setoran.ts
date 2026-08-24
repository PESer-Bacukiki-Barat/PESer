import { RETENSI_DRAFT_HARI } from "@/lib/constants"

/**
 * Antrean setoran offline — PRD §4.3 aturan 1–2, FR-F2.
 *
 * "Draft setoran di IndexedDB status PENDING_SYNC" dan "Setiap draft wajib
 * punya idempotencyKey (UUID v4) dari client". Kunci itu sekaligus primary key
 * di sini: satu draft = satu kunci, jadi menyimpan dua kali tidak mungkin
 * menghasilkan dua setoran.
 *
 * Penyimpanannya dibuat sebagai antarmuka supaya logika sinkronisasi bisa diuji
 * tanpa browser. IndexedDB hanya salah satu implementasinya.
 */

export type StatusAntrean = "PENDING_SYNC" | "GAGAL" | "KEDALUWARSA"

/** Payload yang dikirim ke POST /api/setoran, apa adanya. */
export type PayloadSetoran = {
  nasabahId: string
  cashDibayar: boolean
  items: { jenisSampahId: string; berat: number; kondisi: string }[]
}

export type DraftSetoran = {
  /** UUID v4 dari klien; sekaligus primary key (§4.3 aturan 2). */
  idempotencyKey: string
  payload: PayloadSetoran
  /**
   * Ringkasan untuk ditampilkan di daftar antrean tanpa perlu online.
   * Disimpan saat draft dibuat karena nama nasabah dan total tidak bisa
   * dihitung ulang saat offline.
   */
  ringkasan: { nasabah: string; totalBerat: number; totalNilai: number }
  status: StatusAntrean
  /** ISO string; dipakai untuk retensi 7 hari. */
  dibuatPada: string
  percobaan: number
  pesanGagal?: string
}

export interface PenyimpananAntrean {
  semua(): Promise<DraftSetoran[]>
  simpan(draft: DraftSetoran): Promise<void>
  hapus(idempotencyKey: string): Promise<void>
}

/** Implementasi in-memory — dipakai test, dan sebagai fallback kalau IndexedDB tidak ada. */
export class AntreanMemori implements PenyimpananAntrean {
  private data = new Map<string, DraftSetoran>()

  constructor(awal: DraftSetoran[] = []) {
    for (const d of awal) this.data.set(d.idempotencyKey, d)
  }

  async semua(): Promise<DraftSetoran[]> {
    return [...this.data.values()].sort((a, b) =>
      a.dibuatPada.localeCompare(b.dibuatPada),
    )
  }

  async simpan(draft: DraftSetoran): Promise<void> {
    this.data.set(draft.idempotencyKey, draft)
  }

  async hapus(idempotencyKey: string): Promise<void> {
    this.data.delete(idempotencyKey)
  }
}

// ------------------------------------------------------------- IndexedDB

const NAMA_DB = "peser-antrean"
const VERSI_DB = 1
const STORE = "setoran"

function bukaDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(NAMA_DB, VERSI_DB)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "idempotencyKey" })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function jalankan<T>(
  mode: IDBTransactionMode,
  aksi: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return bukaDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE, mode)
        const req = aksi(tx.objectStore(STORE))
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error)
        tx.oncomplete = () => db.close()
      }),
  )
}

class AntreanIndexedDb implements PenyimpananAntrean {
  async semua(): Promise<DraftSetoran[]> {
    const semua = await jalankan<DraftSetoran[]>("readonly", (s) => s.getAll())
    return semua.sort((a, b) => a.dibuatPada.localeCompare(b.dibuatPada))
  }

  async simpan(draft: DraftSetoran): Promise<void> {
    await jalankan("readwrite", (s) => s.put(draft))
  }

  async hapus(idempotencyKey: string): Promise<void> {
    await jalankan("readwrite", (s) => s.delete(idempotencyKey))
  }
}

/**
 * Penyimpanan antrean untuk browser. Jatuh ke memori kalau IndexedDB tidak
 * tersedia (mode privat di sebagian browser) — antreannya hilang saat tab
 * ditutup, tapi lebih baik daripada form yang gagal total.
 */
export function penyimpananAntrean(): PenyimpananAntrean {
  if (typeof indexedDB === "undefined") return new AntreanMemori()
  return new AntreanIndexedDb()
}

// --------------------------------------------------------------- retensi

/** Draft menggantung lebih dari RETENSI_DRAFT_HARI dianggap kedaluwarsa (§4.3). */
export function sudahKedaluwarsa(draft: DraftSetoran, sekarang: Date): boolean {
  const umurHari =
    (sekarang.getTime() - new Date(draft.dibuatPada).getTime()) / 86_400_000
  return umurHari > RETENSI_DRAFT_HARI
}

export function buatDraft(
  idempotencyKey: string,
  payload: PayloadSetoran,
  ringkasan: DraftSetoran["ringkasan"],
  sekarang: Date = new Date(),
): DraftSetoran {
  return {
    idempotencyKey,
    payload,
    ringkasan,
    status: "PENDING_SYNC",
    dibuatPada: sekarang.toISOString(),
    percobaan: 0,
  }
}
