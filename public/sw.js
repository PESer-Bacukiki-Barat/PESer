/**
 * Service worker PESer — FR-F1.
 *
 * Ditulis sebagai berkas statis biasa, bukan lewat bundler, supaya isinya bisa
 * dibaca dan di-debug apa adanya di DevTools tanpa source map.
 *
 * Aturan cache mengikuti tabel PRD §4.3 secara harfiah:
 *
 *   Input setoran        -> wajib offline   (shell di-cache)
 *   Daftar nasabah       -> cache           (/petugas/setor)
 *   Stock sendiri        -> cache + tandai  (/petugas/stock)
 *   Dispatch             -> BUTUH ONLINE    (jangan pernah di-cache)
 *   Laporan              -> BUTUH ONLINE    (jangan pernah di-cache)
 *   Master data          -> BUTUH ONLINE    (jangan pernah di-cache)
 *
 * §4.3 [WAJIB] "Jangan cache halaman dispatch/laporan" bukan sekadar soal
 * kesegaran data: stock basi bisa membuat admin menjual barang yang sama dua
 * kali. Karena itu daftar JANGAN_CACHE di bawah diperiksa lebih dulu daripada
 * aturan apa pun.
 *
 * Antrean setoran TIDAK ditangani di sini. Ia hidup di IndexedDB milik aplikasi
 * (lihat src/lib/antrean-setoran.ts) karena antrean perlu terlihat dan bisa
 * dikelola pengguna — badge, jumlah, peringatan sebelum logout — dan itu
 * mustahil kalau pengirimannya tersembunyi di dalam fetch handler.
 */

const VERSI = "peser-v1"
const CACHE_SHELL = `${VERSI}-shell`
const CACHE_HALAMAN = `${VERSI}-halaman`

/** Aset yang di-precache saat install. Sengaja sedikit: gagal satu, gagal semua. */
const SHELL = ["/offline", "/icons/icon-192.png", "/manifest.webmanifest"]

/**
 * Jalur yang TIDAK BOLEH di-cache dalam keadaan apa pun (§4.3).
 * Diperiksa sebelum aturan lain.
 */
const JANGAN_CACHE = [
  "/api/",
  "/admin",
  "/petugas/dispatch",
  "/login",
  "/dashboard",
]

/** Halaman petugas yang boleh disajikan dari cache saat offline. */
const BOLEH_CACHE = ["/petugas", "/petugas/setor", "/petugas/stock", "/petugas/riwayat"]

const HEADER_WAKTU_CACHE = "X-Peser-Cached-At"

function jangan(pathname) {
  return JANGAN_CACHE.some((p) => pathname === p || pathname.startsWith(p))
}

function boleh(pathname) {
  return BOLEH_CACHE.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_SHELL)
      // addAll gagal seluruhnya kalau salah satu 404, jadi ditambahkan
      // satu-satu agar aset yang ada tetap tersimpan.
      .then((cache) => Promise.allSettled(SHELL.map((url) => cache.add(url))))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names.filter((n) => !n.startsWith(VERSI)).map((n) => caches.delete(n)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

/**
 * Simpan salinan respons beserta waktu pengambilannya, supaya UI bisa
 * memberi tahu "data per jam X" seperti diminta §4.3.
 */
async function simpan(request, response) {
  const salinan = response.clone()
  const headers = new Headers(salinan.headers)
  headers.set(HEADER_WAKTU_CACHE, new Date().toISOString())
  const body = await salinan.blob()
  const cache = await caches.open(CACHE_HALAMAN)
  await cache.put(
    request,
    new Response(body, {
      status: salinan.status,
      statusText: salinan.statusText,
      headers,
    }),
  )
}

self.addEventListener("fetch", (event) => {
  const { request } = event
  if (request.method !== "GET") return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  // Aturan pertama dan tidak bisa ditawar: jangan sentuh yang butuh online.
  if (jangan(url.pathname)) return

  // Aset build Next.js diberi hash, jadi cache-first aman dan cepat.
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(
      caches.match(request).then(
        (tersimpan) =>
          tersimpan ||
          fetch(request).then((res) => {
            if (res.ok) {
              const salinan = res.clone()
              caches.open(CACHE_SHELL).then((c) => c.put(request, salinan))
            }
            return res
          }),
      ),
    )
    return
  }

  // Navigasi halaman petugas: network-first, jatuh ke cache saat offline.
  if (request.mode === "navigate" && boleh(url.pathname)) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) simpan(request, res)
          return res
        })
        .catch(async () => {
          const tersimpan = await caches.match(request, { ignoreSearch: true })
          if (tersimpan) return tersimpan
          const fallback = await caches.match("/offline")
          return (
            fallback ||
            new Response("Offline", {
              status: 503,
              headers: { "Content-Type": "text/plain; charset=utf-8" },
            })
          )
        }),
    )
  }
})

/**
 * Dipicu aplikasi lewat postMessage saat antrean berhasil dikirim, supaya
 * halaman stock yang tersimpan tidak menampilkan angka sebelum setoran.
 */
self.addEventListener("message", (event) => {
  if (event.data === "bersihkan-cache-halaman") {
    event.waitUntil(caches.delete(CACHE_HALAMAN))
  }
})
