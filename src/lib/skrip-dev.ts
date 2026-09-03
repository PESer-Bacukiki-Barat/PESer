/**
 * Pembersih service worker untuk lingkungan pengembangan.
 *
 * `public/sw.js` menyajikan `/_next/static/` secara cache-first dengan alasan
 * yang ditulis di berkas itu sendiri: "aset build Next.js diberi hash, jadi
 * cache-first aman". Benar di produksi — nama berkasnya memuat hash isinya,
 * jadi isi baru selalu berarti URL baru.
 *
 * Di pengembangan asumsi itu tidak berlaku. Turbopack memakai ulang nama chunk
 * dengan isi yang berbeda, sehingga service worker menyajikan JavaScript lama
 * atas URL yang sama sementara server sudah mengirim HTML baru. Akibatnya galat
 * hidrasi yang menunjuk komponen yang tidak bersalah, dan yang paling
 * menyesatkan: ia tetap muncul walau server dinyalakan ulang dan `.next` sudah
 * dihapus, karena sumber basinya ada di peramban, bukan di server.
 *
 * Karena scope-nya "/", satu pendaftaran dari kunjungan ke area petugas ikut
 * mencegat permintaan di /login dan /admin. Jadi pembersihannya perlu berjalan
 * di setiap halaman, bukan hanya di tempat ia didaftarkan — sama seperti
 * SKRIP_TEMA, ia dijalankan sebagai skrip inline sebelum React hydrate.
 *
 * Cache-nya ikut dibuang, karena membatalkan pendaftaran saja tidak menghapus
 * respons yang sudah tersimpan. Hanya cache berawalan `peser-` yang disentuh,
 * supaya milik aplikasi lain di localhost tidak ikut terhapus.
 *
 * Dibungkus try/catch: gagal membersihkan tidak boleh menggagalkan halaman.
 */
export const SKRIP_BUANG_SW = `
try {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.getRegistrations()
      .then(function (d) { d.forEach(function (r) { r.unregister(); }); })
      .catch(function () {});
  }
  if (window.caches && caches.keys) {
    caches.keys()
      .then(function (k) {
        k.filter(function (n) { return n.indexOf("peser-") === 0; })
         .forEach(function (n) { caches.delete(n); });
      })
      .catch(function () {});
  }
} catch (e) {}
`.trim()
