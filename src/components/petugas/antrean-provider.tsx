"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { useRouter } from "next/navigation"

import { api, apiError, apiStatus } from "@/lib/api"
import { useOnline } from "@/lib/use-online"
import {
  buatDraft,
  penyimpananAntrean,
  type DraftSetoran,
  type PayloadSetoran,
  type PenyimpananAntrean,
} from "@/lib/antrean-setoran"
import {
  adaPerubahan,
  klasifikasiKegagalan,
  sinkronkanAntrean,
  type HasilKirim,
  type RingkasanSinkron,
} from "@/lib/sinkron-setoran"

type Konteks = {
  daftar: DraftSetoran[]
  tertunda: number
  gagal: number
  sedangSinkron: boolean
  online: boolean
  /** Simpan draft ke antrean. Dipakai form setoran saat pengiriman langsung gagal. */
  antrekan: (
    idempotencyKey: string,
    payload: PayloadSetoran,
    ringkasan: DraftSetoran["ringkasan"],
  ) => Promise<void>
  sinkron: () => Promise<RingkasanSinkron | null>
  buang: (idempotencyKey: string) => Promise<void>
  /** Kembalikan draft GAGAL/KEDALUWARSA ke antrean untuk dicoba lagi. */
  cobaLagi: (idempotencyKey: string) => Promise<void>
}

const AntreanContext = createContext<Konteks | null>(null)

/** Kirim satu draft, lalu terjemahkan hasilnya ke bentuk yang sinkronisasi pahami. */
async function kirimDraft(draft: DraftSetoran): Promise<HasilKirim> {
  try {
    const res = await api.post<{ id: string }>("/setoran", draft.payload, {
      headers: { "Idempotency-Key": draft.idempotencyKey },
    })
    return {
      jenis: "sukses",
      id: res.data?.id,
      // §4.3 aturan 3: kunci yang sudah diproses dikembalikan sebagai hasil lama.
      replay: res.headers["idempotent-replay"] === "true",
    }
  } catch (e) {
    return klasifikasiKegagalan(apiStatus(e), apiError(e))
  }
}

export function AntreanProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [daftar, setDaftar] = useState<DraftSetoran[]>([])
  const [sedangSinkron, setSedangSinkron] = useState(false)
  const online = useOnline()

  // Penyimpanan dibuat sekali; IndexedDB hanya ada di browser.
  const penyimpanan = useRef<PenyimpananAntrean | null>(null)
  const ambilPenyimpanan = useCallback(() => {
    penyimpanan.current ??= penyimpananAntrean()
    return penyimpanan.current
  }, [])

  const muat = useCallback(async () => {
    setDaftar(await ambilPenyimpanan().semua())
  }, [ambilPenyimpanan])

  const sinkron = useCallback(async () => {
    // Mencegah dua proses sinkron berjalan bersamaan (mis. event online
    // datang saat sinkron manual sedang jalan).
    if (sedangSinkron) return null
    setSedangSinkron(true)
    try {
      const hasil = await sinkronkanAntrean(ambilPenyimpanan(), kirimDraft)
      await muat()
      if (adaPerubahan(hasil)) {
        // Data server berubah, jadi halaman yang sudah tersimpan di cache
        // service worker (stock, riwayat) sudah basi.
        navigator.serviceWorker?.controller?.postMessage("bersihkan-cache-halaman")
        router.refresh()
      }
      return hasil
    } finally {
      setSedangSinkron(false)
    }
  }, [ambilPenyimpanan, muat, router, sedangSinkron])

  const antrekan = useCallback<Konteks["antrekan"]>(
    async (idempotencyKey, payload, ringkasan) => {
      await ambilPenyimpanan().simpan(buatDraft(idempotencyKey, payload, ringkasan))
      await muat()
    },
    [ambilPenyimpanan, muat],
  )

  const buang = useCallback(
    async (key: string) => {
      await ambilPenyimpanan().hapus(key)
      await muat()
    },
    [ambilPenyimpanan, muat],
  )

  const cobaLagi = useCallback(
    async (key: string) => {
      const store = ambilPenyimpanan()
      const draft = (await store.semua()).find((d) => d.idempotencyKey === key)
      if (!draft) return
      await store.simpan({ ...draft, status: "PENDING_SYNC", pesanGagal: undefined })
      await muat()
      await sinkron()
    },
    [ambilPenyimpanan, muat, sinkron],
  )

  // Muat antrean dari IndexedDB + daftarkan service worker.
  useEffect(() => {
    void muat()

    if ("serviceWorker" in navigator) {
      if (process.env.NODE_ENV === "production") {
        // Kegagalan registrasi tidak boleh menjatuhkan aplikasi: PWA adalah
        // peningkatan, bukan syarat untuk bisa mencatat setoran.
        navigator.serviceWorker.register("/sw.js").catch(() => {})
      } else {
        // Di pengembangan service worker justru merugikan. sw.js menyajikan
        // `/_next/static/` secara cache-first dengan alasan "aset build Next
        // diberi hash" — benar di produksi, tapi TIDAK di dev: Turbopack
        // memakai ulang nama chunk dengan isi yang berbeda, jadi peramban
        // menjalankan JS lama di atas HTML baru. Hasilnya galat hidrasi yang
        // menyalahkan komponen yang tidak bersalah, dan tetap muncul walau
        // server sudah dinyalakan ulang serta .next sudah dihapus.
        //
        // Yang sudah terpasang juga dibuang, karena scope-nya "/" sehingga ia
        // ikut mencegat permintaan halaman lain seperti /login.
        void navigator.serviceWorker
          .getRegistrations()
          .then((daftar) => Promise.all(daftar.map((r) => r.unregister())))
          .catch(() => {})
      }
    }
  }, [muat])

  // FR-F3: kirim antrean saat koneksi pulih. Statusnya sendiri dibaca
  // useOnline(); di sini hanya efek sampingnya.
  useEffect(() => {
    const naik = () => void sinkron()
    window.addEventListener("online", naik)
    return () => window.removeEventListener("online", naik)
  }, [sinkron])

  const nilai = useMemo<Konteks>(
    () => ({
      daftar,
      tertunda: daftar.filter((d) => d.status === "PENDING_SYNC").length,
      gagal: daftar.filter((d) => d.status !== "PENDING_SYNC").length,
      sedangSinkron,
      online,
      antrekan,
      sinkron,
      buang,
      cobaLagi,
    }),
    [daftar, sedangSinkron, online, antrekan, sinkron, buang, cobaLagi],
  )

  return <AntreanContext.Provider value={nilai}>{children}</AntreanContext.Provider>
}

export function useAntrean(): Konteks {
  const ctx = useContext(AntreanContext)
  if (!ctx) throw new Error("useAntrean harus dipakai di dalam AntreanProvider")
  return ctx
}
