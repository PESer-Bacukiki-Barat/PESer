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

describe("kenyamanan pakai", () => {
  it("Field menyambungkan error & petunjuk ke input-nya", () => {
    // Tanpa aria-describedby, pesan error dirender berdekatan secara visual
    // tapi tidak terhubung — pembaca layar membacakan input tanpa pernah
    // menyebut apa yang salah dengannya.
    const f = isi.get("src/components/admin/form-fields.tsx")!
    expect(f).toContain("aria-describedby")
    expect(f).toContain("aria-invalid")
    // Pesan yang MUNCUL setelah submit harus diumumkan, bukan hanya tampil.
    expect(f).toContain('role="alert"')
    // Tanda bintang telanjang dibacakan "star" tanpa makna.
    expect(f).toContain("wajib diisi")
  })

  it("tombol aksi baris punya daerah sentuh 44px (PRD §8.7)", () => {
    // Ukuran visual tetap 32px supaya kepadatan tabel desktop tidak rusak;
    // yang diperbesar hanya daerah tangkapnya, dan hanya di perangkat sentuh.
    expect(isi.get("src/components/ui/row-action-button.tsx")).toContain("sentuh-nyaman")
    expect(css).toContain("@utility sentuh-nyaman")
    expect(css).toContain("pointer: coarse")
    expect(css).toMatch(/min-width:\s*44px/)
    expect(css).toMatch(/min-height:\s*44px/)
  })

  it("UI berbahasa Indonesia — tidak ada sisa salin bawaan Inggris", () => {
    // AGENTS.md: "UI copy is Indonesian". Paginasi DataTable sempat tertinggal
    // dalam bahasa Inggris karena ia komponen yang jarang dibaca ulang.
    const dt = isi.get("src/components/ui/data-table.tsx")!
    // Hanya salin UI yang dulu benar-benar ada di berkas ini. Substring umum
    // seperti "of " ikut cocok dengan sintaks TypeScript (`for (const x of …)`)
    // dan akan membuat tes merah tanpa ada yang salah.
    for (const inggris of ["Showing", "Previous", "results</p>"]) {
      expect(dt).not.toContain(inggris)
    }
    expect(dt).toContain("Menampilkan")
    expect(dt).toContain("Sebelumnya")
    expect(dt).toContain("Berikutnya")
  })

  it("tabel memberi tahu saat isinya berubah karena filter", () => {
    // Menyaring mengubah isi tanpa memindahkan fokus; tanpa aria-live pengguna
    // pembaca layar tidak akan tahu hasilnya berubah.
    expect(isi.get("src/components/ui/data-table.tsx")).toContain('aria-live="polite"')
  })

  it("keadaan kosong membedakan 'belum ada data' dari 'tersaring habis'", () => {
    // Yang kedua butuh jalan keluar, bukan sekadar pemberitahuan.
    const dt = isi.get("src/components/ui/data-table.tsx")!
    expect(dt).toContain("sedangMenyaring")
    expect(dt).toContain("Hapus filter")
  })
})

describe("konsistensi tampilan", () => {
  it("tidak ada pemformat angka yang didefinisikan ulang di luar src/lib/format.ts", () => {
    // 34 definisi lokal di 19 berkas sudah mulai menyimpang sebelum disatukan:
    // sebelas membulatkan rupiah, empat membiarkan desimal. Angka yang sama
    // tampil berbeda antar layar.
    const pelanggar = [...isi.entries()]
      .filter(([f]) => f !== "src/lib/format.ts")
      .filter(([, teks]) => /const (fmtRupiah|fmtBerat|fmtTanggal|formatCurrency)\s*=/.test(teks))
      .map(([f]) => f)
    expect(pelanggar).toEqual([])
  })

  it("blok aksi form memakai komponen bersama, bukan susunan sendiri", () => {
    // Sebelumnya dispatch-form merakit tombolnya sendiri dengan rounded-full
    // dan bg-primary-container, jadi ia terlihat berasal dari aplikasi lain.
    const pelanggar = [...isi.entries()]
      .filter(([f]) => /components\/admin\/.*-form\.tsx$/.test(f))
      .filter(([, teks]) => teks.includes('justify-end gap-4 pt-6'))
      .map(([f]) => f)
    expect(pelanggar).toEqual([])
  })

  it("setiap form admin punya keadaan menyimpan — tidak bisa submit dobel", () => {
    // dispatch-form sempat tidak punya sama sekali: menekannya dua kali
    // membuat dua dispatch.
    for (const [f, teks] of isi) {
      if (!/components\/admin\/.*-form\.tsx$/.test(f)) continue
      if (!teks.includes("<AksiForm")) continue
      expect(teks).toContain("menyimpan=")
    }
  })
})

describe("identitas & kontrol yang jujur", () => {
  it("cn() tahu ukuran teks DESIGN.md, tidak membuangnya", () => {
    // tailwind-merge menyangka `text-body-md` (ukuran) sekelompok dengan
    // `text-on-surface` (warna) karena sama-sama berawalan `text-`, lalu
    // MEMBUANG yang lebih dulu. Akibatnya nyata dan senyap: input password di
    // halaman login sempat berukuran font berbeda dari input email.
    const u = isi.get("src/lib/utils.ts")!
    expect(u).toContain("extendTailwindMerge")
    expect(u).toContain('"font-size"')
    expect(u).toContain("body-md")
  })

  it("satu lambang untuk seluruh aplikasi", () => {
    // Sebelumnya login memakai ikon daur ulang bawaan lucide, sidebar memakai
    // huruf "P" dalam kotak — dua identitas untuk satu produk.
    expect(BERKAS).toContain("src/components/brand/logo-peser.tsx")
    for (const f of ["src/app/login/page.tsx", "src/components/admin/admin-nav.tsx"]) {
      expect(isi.get(f)).toContain("LogoPeser")
    }
  })

  it("tidak ada kontrol yang berpura-pura bekerja di topbar admin", () => {
    // Kotak pencarian tanpa handler dan tombol Settings tanpa aksi lebih
    // menyesatkan daripada tidak ada sama sekali.
    const nav = isi.get("src/components/admin/admin-nav.tsx")!
    expect(nav).not.toContain('placeholder="Search..."')
    expect(nav).not.toContain('aria-label="Settings"')
    // Avatar menampilkan pengguna yang benar-benar masuk, bukan "AP".
    expect(nav).toContain("inisial(nama)")
  })

  it("animasi dipakai sekali per layar, bukan per kartu", () => {
    // Animasi bertingkat pada tiap kartu terlihat mewah di tangkapan layar
    // tapi menyiksa saat dipakai: pengguna menunggu barisan yang belum sampai.
    expect(css).toContain("@keyframes masuk-halus")
    const pemakai = [...isi.entries()].filter(([, t]) => /className="masuk /.test(t))
    expect(pemakai.length).toBeLessThanOrEqual(4)
  })

  it("aksen warna punya arti tetap, bukan warna acak", () => {
    const a = isi.get("src/lib/aksen.ts")!
    // Semuanya dari palet DESIGN.md yang sudah berpasangan dengan warna teks,
    // jadi kontrasnya terjaga di terang maupun gelap.
    for (const nama of ["tempat", "orang", "barang", "gerak", "perhatian"]) {
      expect(a).toContain(nama)
    }
    expect(a).not.toMatch(/-(red|blue|green|amber|purple)-\d/)
  })
})
