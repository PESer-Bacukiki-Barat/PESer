"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Bell, PackageCheck, Warehouse } from "lucide-react"

import { Modal } from "@/components/ui/modal"
import { api } from "@/lib/api"
import { useOnline } from "@/lib/use-online"
import { JEDA_POLL_NOTIFIKASI_MS } from "@/lib/constants"

export type NotifikasiItem = {
  id: string
  tipe: "STOCK_THRESHOLD" | "DISPATCH_MASUK"
  judul: string
  pesan: string
  tautan: string | null
  dibacaPada: string | null
  createdAt: string
  bankSampah: { id: string; nama: string } | null
}

const IKON = {
  STOCK_THRESHOLD: Warehouse,
  DISPATCH_MASUK: PackageCheck,
} as const

/** "3 menit lalu" — cukup untuk daftar pendek, tanpa menambah dependensi. */
function sejak(iso: string): string {
  const detik = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000))
  if (detik < 60) return "baru saja"
  const menit = Math.floor(detik / 60)
  if (menit < 60) return `${menit} menit lalu`
  const jam = Math.floor(menit / 60)
  if (jam < 24) return `${jam} jam lalu`
  const hari = Math.floor(jam / 24)
  return hari === 1 ? "kemarin" : `${hari} hari lalu`
}

/**
 * Lonceng notifikasi — FR-E5.
 *
 * PRD §4.2 menetapkan tidak ada message broker: notifikasi disimpan di DB lalu
 * DITARIK aplikasi, tanpa cron (BR-06). Jadi komponen ini melakukan polling,
 * bukan menunggu push.
 *
 * Pollingnya berhenti sendiri saat tab tidak terlihat dan saat perangkat
 * offline — petugas bekerja dari HP di lapangan, dan permintaan yang pasti
 * gagal hanya menghabiskan baterai serta kuota. Begitu tab kembali terlihat
 * atau koneksi pulih, sekali tarik langsung dilakukan supaya tidak menunggu
 * satu jeda penuh.
 */
export function LoncengNotifikasi({
  className = "",
}: {
  className?: string
}) {
  const router = useRouter()
  const online = useOnline()

  const [daftar, setDaftar] = useState<NotifikasiItem[]>([])
  const [belumDibaca, setBelumDibaca] = useState(0)
  const [buka, setBuka] = useState(false)
  const [memuat, setMemuat] = useState(false)

  // Ref, bukan state: dipakai untuk membatalkan hasil permintaan yang sudah
  // basi, dan mengubahnya tidak boleh memicu render.
  const permintaanKe = useRef(0)

  const tarik = useCallback(async () => {
    const nomor = ++permintaanKe.current
    setMemuat(true)
    try {
      const res = await api.get("/notifikasi")
      // Respons yang datang terlambat tidak boleh menimpa yang lebih baru.
      if (nomor !== permintaanKe.current) return
      setDaftar(res.data?.daftar ?? [])
      setBelumDibaca(res.data?.belumDibaca ?? 0)
    } catch {
      // Gagal menarik notifikasi bukan kegagalan yang perlu mengganggu layar:
      // angka yang ada dipertahankan sampai tarikan berikutnya berhasil.
    } finally {
      if (nomor === permintaanKe.current) setMemuat(false)
    }
  }, [])

  useEffect(() => {
    if (!online) return

    const jalan = () => {
      if (document.visibilityState !== "visible") return
      void tarik()
    }

    jalan()
    const timer = window.setInterval(jalan, JEDA_POLL_NOTIFIKASI_MS)
    document.addEventListener("visibilitychange", jalan)

    return () => {
      window.clearInterval(timer)
      document.removeEventListener("visibilitychange", jalan)
    }
  }, [online, tarik])

  async function tandaiSemua() {
    setBelumDibaca(0)
    setDaftar((p) => p.map((n) => ({ ...n, dibacaPada: n.dibacaPada ?? new Date().toISOString() })))
    try {
      await api.post("/notifikasi/baca", {})
    } catch {
      // Server menolak: tarik ulang supaya layar kembali sesuai kebenaran DB.
      void tarik()
    }
  }

  async function buka1(n: NotifikasiItem) {
    if (!n.dibacaPada) {
      setBelumDibaca((p) => Math.max(0, p - 1))
      setDaftar((p) =>
        p.map((x) => (x.id === n.id ? { ...x, dibacaPada: new Date().toISOString() } : x)),
      )
      // Sengaja tidak di-await: menandai baca tidak boleh menahan navigasi.
      api.post("/notifikasi/baca", { id: n.id }).catch(() => void tarik())
    }
    setBuka(false)
    if (n.tautan) router.push(n.tautan)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setBuka(true)
          if (online) void tarik()
        }}
        aria-label={
          belumDibaca > 0 ? `${belumDibaca} notifikasi belum dibaca` : "Notifikasi"
        }
        className={`relative flex size-9 shrink-0 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container-high focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/50 ${className}`}
      >
        <Bell className="size-5" aria-hidden />
        {belumDibaca > 0 && (
          <span
            aria-hidden
            className="absolute -top-0.5 -right-0.5 flex min-w-4 items-center justify-center rounded-full bg-error px-1 font-mono text-label-xs leading-4 text-on-error"
          >
            {belumDibaca > 9 ? "9+" : belumDibaca}
          </span>
        )}
      </button>

      <Modal
        open={buka}
        onOpenChange={setBuka}
        title="Notifikasi"
        description={
          belumDibaca > 0
            ? `${belumDibaca} belum dibaca`
            : "Semua notifikasi sudah dibaca."
        }
        footer={
          belumDibaca > 0 ? (
            <button
              type="button"
              onClick={tandaiSemua}
              className="h-10 rounded-lg border border-outline-variant px-4 font-label-md text-label-md text-on-surface transition-colors duration-fast hover:bg-surface-container-low focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/50"
            >
              Tandai semua dibaca
            </button>
          ) : undefined
        }
      >
        {daftar.length === 0 ? (
          <p className="font-body-md text-body-md text-on-surface-variant">
            {memuat ? "Memuat…" : "Belum ada notifikasi."}
          </p>
        ) : (
          <ul className="space-y-2">
            {daftar.map((n) => {
              const Ikon = IKON[n.tipe] ?? Bell
              const baru = !n.dibacaPada
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => buka1(n)}
                    className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/50 ${
                      baru
                        ? "border-primary/40 bg-primary-container/20 hover:bg-primary-container/30"
                        : "border-outline-variant hover:bg-surface-container-low"
                    }`}
                  >
                    <Ikon
                      className={`mt-0.5 size-5 shrink-0 ${baru ? "text-primary" : "text-on-surface-variant"}`}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block font-label-md text-label-md text-on-surface">
                        {n.judul}
                      </span>
                      <span className="block font-body-md text-body-md text-on-surface-variant">
                        {n.pesan}
                      </span>
                      <span className="mt-1 block font-label-sm text-label-sm text-on-surface-variant">
                        {sejak(n.createdAt)}
                        {n.bankSampah ? ` · ${n.bankSampah.nama}` : ""}
                      </span>
                    </span>
                    {baru && (
                      <span
                        aria-label="Belum dibaca"
                        className="mt-1.5 size-2 shrink-0 rounded-full bg-primary"
                      />
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </Modal>
    </>
  )
}
