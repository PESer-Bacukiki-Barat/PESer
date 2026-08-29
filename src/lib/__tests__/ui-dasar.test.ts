/**
 * Penjaga dasar UI.
 *
 * Empat cacat di bawah ini punya sifat yang sama: tidak satu pun tertangkap
 * tsc, eslint, atau build, dan semuanya baru terasa oleh orang yang paling
 * sulit bersuara — pengguna keyboard, pengguna yang sensitif gerak, dan petugas
 * di sinyal lapangan. Karena itu penjaganya harus tes.
 *
 * Semuanya pernah benar-benar terjadi di repo ini:
 * - Tidak ada satu pun aturan `prefers-reduced-motion` (WCAG 2.3.3).
 * - Tujuh berkas punya `<button>` tanpa `focus-visible`.
 * - Halaman login memakai palet Tailwind mentah, bukan token DESIGN.md, jadi
 *   layar pertama aplikasi tidak ikut tema maupun mode gelap.
 * - `transition-all` menganimasikan properti tata letak dan memicu jank.
 */
import { readdirSync, readFileSync } from "node:fs"
import { join, relative, sep } from "node:path"

const AKAR = join(__dirname, "..", "..", "..")
const css = readFileSync(join(AKAR, "src", "app", "globals.css"), "utf8")

function telusuri(dir: string, keluar: string[] = []): string[] {
  for (const entri of readdirSync(dir, { withFileTypes: true })) {
    const penuh = join(dir, entri.name)
    if (entri.isDirectory()) {
      if (entri.name === "__tests__" || entri.name === "generated") continue
      telusuri(penuh, keluar)
    } else if (/\.tsx?$/.test(entri.name)) {
      keluar.push(relative(AKAR, penuh).split(sep).join("/"))
    }
  }
  return keluar
}

const BERKAS = telusuri(join(AKAR, "src"))
const isi = new Map(BERKAS.map((f) => [f, readFileSync(join(AKAR, f), "utf8")]))

/**
 * `components/ui/button.tsx` berasal dari base-nova dan sengaja tidak diubah:
 * `transition-all` di sana memang dipakai untuk mentransisikan border dan ring
 * sekaligus, dan mengubahnya berisiko merusak varian bawaannya.
 */
const DIKECUALIKAN = new Set(["src/components/ui/button.tsx"])

describe("gerak", () => {
  it("globals.css menghormati prefers-reduced-motion (WCAG 2.3.3)", () => {
    expect(css).toContain("prefers-reduced-motion")
    // Durasi dipangkas, bukan dinolkan: transisi 0 membuat sebagian callback
    // `transitionend` tidak pernah menyala.
    expect(css).toMatch(/transition-duration:\s*1ms\s*!important/)
    expect(css).toMatch(/animation-duration:\s*1ms\s*!important/)
  })

  it("punya token durasi dan easing, bukan angka ad hoc", () => {
    for (const token of [
      "--duration-fast",
      "--duration-normal",
      "--duration-slow",
      "--ease-standard",
      "--ease-emphasized",
    ]) {
      expect(css).toContain(token)
    }
  })

  it("tidak ada transition-all di kode aplikasi", () => {
    // Ia ikut menganimasikan width/height/padding, jadi setiap perubahan kelas
    // berpotensi memicu reflow bertahap alih-alih perpindahan yang bersih.
    const pelanggar = BERKAS.filter(
      (f) => !DIKECUALIKAN.has(f) && isi.get(f)!.includes("transition-all"),
    )
    expect(pelanggar).toEqual([])
  })
})

describe("fokus keyboard", () => {
  it("setiap <button> mentah punya focus-visible", () => {
    // Komponen <Button> sudah membawanya dari base-nova; yang diperiksa di sini
    // adalah elemen <button> yang ditulis langsung.
    const pelanggar: string[] = []
    for (const [f, teks] of isi) {
      const jumlahButton = (teks.match(/<button[\s>]/g) ?? []).length
      if (jumlahButton === 0) continue
      const jumlahFokus = (teks.match(/focus-visible:/g) ?? []).length
      if (jumlahFokus < jumlahButton) {
        pelanggar.push(`${f} (${jumlahButton} button, ${jumlahFokus} focus-visible)`)
      }
    }
    expect(pelanggar).toEqual([])
  })
})

describe("palet", () => {
  it("tidak ada warna palet Tailwind mentah di luar token DESIGN.md", () => {
    // Warna mentah tidak ikut mode gelap dan tidak ikut berubah saat palet
    // DESIGN.md disesuaikan — persis yang membuat halaman login dulu terlihat
    // seperti aplikasi yang berbeda.
    const pola =
      /\b(?:bg|text|border|ring|from|to|via|divide|outline|shadow|decoration|accent|caret)-(?:zinc|slate|gray|neutral|stone|emerald|green|red|blue|amber|yellow|orange|purple|pink|indigo|teal|cyan|lime|rose|violet|fuchsia|sky)-\d{2,3}\b/g

    const pelanggar: string[] = []
    for (const [f, teks] of isi) {
      const cocok = teks.match(pola)
      if (cocok) pelanggar.push(`${f}: ${[...new Set(cocok)].join(", ")}`)
    }
    expect(pelanggar).toEqual([])
  })
})

describe("umpan balik memuat & gagal", () => {
  it("setiap area punya loading.tsx", () => {
    // Tanpa ini navigasi ke halaman server tidak menampilkan apa pun sampai
    // server menjawab — di sinyal lapangan itu terbaca sebagai aplikasi macet.
    for (const area of ["src/app/admin", "src/app/petugas", "src/app/(user)"]) {
      expect(BERKAS).toContain(`${area}/loading.tsx`)
    }
  })

  it("ada batas error, supaya kegagalan runtime tidak jatuh ke layar bawaan Next", () => {
    expect(BERKAS).toContain("src/app/error.tsx")
  })
})

describe("PWA di HP", () => {
  it("viewport memakai viewport-fit=cover", () => {
    // Tanpa ini env(safe-area-inset-*) SELALU 0 dan seluruh penyesuaian
    // gesture bar iOS tidak berpengaruh apa pun.
    expect(isi.get("src/app/layout.tsx")).toContain('viewportFit: "cover"')
  })

  it("bottom nav fixed memberi ruang untuk gesture bar iOS", () => {
    for (const f of [
      "src/components/petugas/petugas-nav.tsx",
      "src/components/user/bottom-nav.tsx",
    ]) {
      expect(isi.get(f)).toContain("pt-aman-bawah")
    }
    expect(css).toContain("safe-area-inset-bottom")
  })

  it("tesnya sendiri benar-benar membaca sumber", () => {
    expect(BERKAS.length).toBeGreaterThan(50)
    expect(css.length).toBeGreaterThan(1000)
  })
})
