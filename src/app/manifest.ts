import type { MetadataRoute } from "next"

/**
 * Manifest PWA — FR-F1.
 *
 * `start_url` mengarah ke /petugas, bukan /, karena PWA ini dipasang di HP
 * petugas: merekalah yang bekerja di lapangan dan butuh alur setoran offline
 * (§4.3 "Hanya alur setoran yang wajib offline"). Admin memakai panelnya dari
 * desktop dan tidak butuh instalasi.
 *
 * Ikon maskable disediakan terpisah dengan safe zone 20% supaya Android tidak
 * memotong isinya saat memangkasnya menjadi bentuk lain.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PESer — Bank Sampah Digital",
    short_name: "PESer",
    description:
      "Catat setoran sampah warga, pantau stock bank sampah, dan proses pengiriman ke pembeli.",
    start_url: "/petugas",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    // Emerald brand dari DESIGN.md
    theme_color: "#006c49",
    lang: "id",
    dir: "ltr",
    categories: ["productivity", "utilities"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icons/maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Catat Setoran",
        short_name: "Setor",
        url: "/petugas/setor",
        description: "Langsung buka form setoran",
      },
      {
        name: "Stock Bank Sampah",
        short_name: "Stock",
        url: "/petugas/stock",
      },
    ],
  }
}
