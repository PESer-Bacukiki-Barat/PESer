/**
 * Penjaga token tema.
 *
 * Tailwind v4 memakai konfigurasi CSS-first: utility warna dan tipografi HANYA
 * dihasilkan kalau kuncinya ada di blok `@theme` globals.css. Kelas yang
 * kuncinya tidak ada tidak menghasilkan CSS apa pun — tidak error, tidak
 * warning, elemennya sekadar mewarisi nilai induknya. Cacat seperti ini lolos
 * dari tsc, eslint, maupun build.
 *
 * Dua kejadian nyata yang memotivasi tes ini:
 * - `text-on-primary` dipakai di 32 tempat tanpa `--color-on-primary`, jadi
 *   teks di atas tombol emerald mewarisi --foreground yang gelap.
 * - `text-headline-sm` dipakai di 13 tempat tanpa `--text-headline-sm`, jadi
 *   angka-angka besar tampil seukuran teks biasa.
 *
 * Tes ini sengaja hanya memeriksa keluarga token milik proyek (DESIGN.md),
 * bukan utility bawaan Tailwind seperti text-sm atau font-bold.
 */
import { readdirSync, readFileSync } from "node:fs"
import { join, relative, sep } from "node:path"

const AKAR = join(__dirname, "..", "..", "..")

const css = readFileSync(join(AKAR, "src", "app", "globals.css"), "utf8")

/** Kunci yang benar-benar terdaftar di @theme. */
const kunciTema = (awalan: string): Set<string> =>
  new Set(
    [...css.matchAll(new RegExp(`--${awalan}-([a-z0-9-]+):`, "g"))].map((m) => m[1]),
  )

const warna = kunciTema("color")
const ukuranTeks = kunciTema("text")
const keluargaFont = kunciTema("font")

/** Walk manual: fs.globSync baru ada di Node 22, mesin build memakai Node 20. */
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

const berkasSumber = telusuri(join(AKAR, "src"))

const sumber = berkasSumber
  .map((f) => `\n/* ${f} */\n${readFileSync(join(AKAR, f), "utf8")}`)
  .join("")

/**
 * Keluarga warna milik DESIGN.md. Dibatasi supaya `text-white`, `bg-red-500`,
 * dan kawan-kawan bawaan Tailwind tidak ikut terjaring.
 */
const KELUARGA_WARNA =
  "on-[a-z-]+|surface[a-z-]*|primary[a-z-]*|secondary[a-z-]*|tertiary[a-z-]*|error[a-z-]*|outline[a-z-]*|inverse-[a-z-]+|background|foreground"

const UTILITY_WARNA =
  "text|bg|border|ring|fill|stroke|from|via|to|decoration|accent|caret|divide|placeholder|shadow|outline"

/** Ambil nama token dari kelas, membuang varian (`md:`) dan opasitas (`/70`). */
function kelasDipakai(pola: RegExp): Map<string, string[]> {
  const hasil = new Map<string, string[]>()
  let berkasKini = "?"
  for (const baris of sumber.split("\n")) {
    const tanda = baris.match(/^\/\* (.+) \*\/$/)
    if (tanda) {
      berkasKini = tanda[1]
      continue
    }
    for (const m of baris.matchAll(pola)) {
      const nama = m[1]
      if (!hasil.has(nama)) hasil.set(nama, [])
      const daftar = hasil.get(nama)!
      if (!daftar.includes(berkasKini)) daftar.push(berkasKini)
    }
  }
  return hasil
}

const laporkan = (nama: string, berkas: string[]) =>
  `${nama} (dipakai di ${berkas.slice(0, 3).join(", ")}${berkas.length > 3 ? `, +${berkas.length - 3} berkas` : ""})`

describe("token tema terdaftar di @theme", () => {
  it("setiap kelas warna proyek punya --color-* di globals.css", () => {
    const dipakai = kelasDipakai(
      new RegExp(`(?:^|[\\s"'\`:])(?:${UTILITY_WARNA})-(${KELUARGA_WARNA})(?=[\\s"'\`/\\]]|$)`, "g"),
    )
    const hilang = [...dipakai.entries()]
      .filter(([nama]) => !warna.has(nama))
      .map(([nama, berkas]) => laporkan(nama, berkas))

    expect(hilang).toEqual([])
  })

  it("setiap ukuran teks proyek punya --text-* di globals.css", () => {
    const dipakai = kelasDipakai(
      /(?:^|[\s"'`:])text-((?:headline|body|label)-[a-z0-9-]+)(?=[\s"'`/\]]|$)/g,
    )
    const hilang = [...dipakai.entries()]
      .filter(([nama]) => !ukuranTeks.has(nama))
      .map(([nama, berkas]) => laporkan(nama, berkas))

    expect(hilang).toEqual([])
  })

  it("setiap keluarga font proyek punya --font-* di globals.css", () => {
    const dipakai = kelasDipakai(
      /(?:^|[\s"'`:])font-((?:headline|body|label)-[a-z0-9-]+)(?=[\s"'`/\]]|$)/g,
    )
    const hilang = [...dipakai.entries()]
      .filter(([nama]) => !keluargaFont.has(nama))
      .map(([nama, berkas]) => laporkan(nama, berkas))

    expect(hilang).toEqual([])
  })

  it("tesnya sendiri benar-benar membaca sumber, bukan string kosong", () => {
    // Tanpa ini, glob yang salah akan membuat ketiga tes di atas lulus palsu.
    expect(berkasSumber.length).toBeGreaterThan(50)
    expect(warna.size).toBeGreaterThan(20)
    expect(sumber).toContain("text-on-primary")
  })
})
