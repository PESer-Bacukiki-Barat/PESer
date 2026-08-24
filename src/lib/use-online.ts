"use client"

import { useSyncExternalStore } from "react"

/**
 * Status koneksi jaringan.
 *
 * Memakai useSyncExternalStore, bukan useState + useEffect, karena tiga
 * alasan sekaligus:
 *
 * 1. `navigator.onLine` tidak ada saat render di server. getServerSnapshot
 *    mengembalikan true, dan React memakainya saat hydration lalu membaca
 *    nilai sebenarnya setelahnya — jadi tidak ada hydration mismatch meski
 *    perangkat sedang offline saat halaman dibuka.
 * 2. Membacanya lewat setState di dalam effect memicu render tambahan dan
 *    ditolak aturan react-hooks/set-state-in-effect.
 * 3. Halaman yang dibuka dalam keadaan SUDAH offline tetap tahu statusnya,
 *    bukan menunggu event transisi yang tidak akan datang.
 */
function subscribe(onChange: () => void): () => void {
  window.addEventListener("online", onChange)
  window.addEventListener("offline", onChange)
  return () => {
    window.removeEventListener("online", onChange)
    window.removeEventListener("offline", onChange)
  }
}

const getSnapshot = () => navigator.onLine

/** Di server dianggap online: pesan "offline" tidak boleh muncul di HTML awal. */
const getServerSnapshot = () => true

export function useOnline(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
