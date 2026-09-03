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

import { cn } from "@/lib/utils"

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
    //
    // Versi pertama penjaga ini hanya mencari `const fmtX =`, jadi 16 tempat
    // lolos — yang memakai `function formatCurrency()` atau memanggil
    // `Intl.NumberFormat` langsung di tempat. Dua di antaranya lupa
    // `maximumFractionDigits`, sehingga Rp 15.000,5 tampil apa adanya di satu
    // layar sementara layar lain membulatkannya ke Rp 15.001. Sekarang yang
    // dilarang adalah APInya, bukan nama variabelnya.
    const pelanggar = [...isi.entries()]
      .filter(([f]) => f !== "src/lib/format.ts")
      .filter(([, teks]) => /new Intl\.NumberFormat/.test(teks))
      .map(([f]) => f)
    expect(pelanggar).toEqual([])
  })

  it("tanggal juga hanya diformat di src/lib/format.ts", () => {
    // Kolom "Dibuat" di tabel kelurahan memakai toLocaleDateString tanpa opsi
    // sama sekali, jadi tampil "3/9/2026" sementara setiap tanggal lain di
    // aplikasi tampil "3 Sep 2026". Dua halaman bukti setor pun memformat
    // setoran yang SAMA dengan bulan penuh di sisi warga dan bulan singkat di
    // sisi petugas.
    const pelanggar = [...isi.entries()]
      .filter(([f]) => f !== "src/lib/format.ts")
      .filter(([, teks]) => /\.toLocale(Date|Time)?String\(/.test(teks))
      .map(([f]) => f)
    expect(pelanggar).toEqual([])
  })

  it("skala tipografi dipakai — tidak ada ukuran font yang dikarang di tempat", () => {
    // Celah antara headline-md (24px) dan body-lg (18px) dulu tidak punya
    // token, jadi judul bagian mengarang ukurannya sendiri: 44 nilai
    // `text-[Npx]` di 20 berkas, dan <h2> saja tampil 16px, 18px, dan 20px
    // untuk peran yang persis sama. Tingkat title-lg/md/sm menutup celahnya,
    // dan tes ini menjaga celahnya tetap tertutup.
    const pelanggar = [...isi.entries()]
      .filter(([, teks]) => /text-\[\d+px\]/.test(teks))
      .map(([f]) => f)
    expect(pelanggar).toEqual([])
  })

  it("cn() mengenali tingkat title & label-xs", () => {
    // Kalau token baru tidak didaftarkan di tailwind-merge, ia menganggap
    // `text-title-md` (ukuran) sekelompok dengan `text-on-surface` (warna)
    // dan membuang salah satunya tanpa peringatan apa pun.
    for (const t of ["title-lg", "title-md", "title-sm", "label-xs"]) {
      expect(cn(`text-${t}`, "text-on-surface")).toContain(`text-${t}`)
      expect(cn(`text-${t}`, "text-on-surface")).toContain("text-on-surface")
    }
  })

  it("setiap tingkat title & label-xs benar-benar menghasilkan CSS", () => {
    // Tiga token pernah jadi hantu di repo ini: dipakai di komponen tapi tidak
    // pernah didefinisikan di @theme, jadi kelasnya tidak menghasilkan aturan
    // apa pun dan ukurannya diam-diam jatuh ke bawaan peramban.
    for (const t of ["title-lg", "title-md", "title-sm", "label-xs"]) {
      expect(css).toContain(`--text-${t}:`)
      expect(css).toContain(`--font-${t}:`)
    }
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

describe("umpan balik & tema", () => {
  it("ada sistem pemberitahuan, dan dibangun dari paket yang sudah ada", () => {
    // §8.1 melarang menambah dependency besar tanpa memeriksa yang sudah ada;
    // Base UI yang sudah terpasang punya Toast.
    const t = isi.get("src/components/ui/toast.tsx")!
    expect(t).toContain("@base-ui/react/toast")
    expect(isi.get("src/app/layout.tsx")).toContain("PenyediaToast")
  })

  it("setiap form admin memberi tahu hasil simpannya", () => {
    // Sebelumnya simpan berhasil hanya membuat layar berpindah, dan gagal di
    // latar belakang lewat tanpa jejak.
    for (const [f, teks] of isi) {
      if (!/components\/admin\/.*-form\.tsx$/.test(f)) continue
      if (!teks.includes("api.post") && !teks.includes("api.put")) continue
      expect(teks).toContain("useToast")
      expect(teks).toContain("toast.gagal")
    }
  })

  it("mode gelap bisa dipilih, bukan hanya ikut OS", () => {
    // Palet gelap sudah lengkap sejak awal tapi pemicunya kelas `.dark` yang
    // tidak pernah dipasang siapa pun.
    expect(BERKAS).toContain("src/components/ui/penukar-tema.tsx")
    const p = isi.get("src/components/ui/penukar-tema.tsx")!
    // Dibaca lewat useSyncExternalStore, bukan setState di dalam effect.
    expect(p).toContain("useSyncExternalStore")
    // Skrip anti-kedip harus berjalan sebelum halaman digambar.
    expect(isi.get("src/app/layout.tsx")).toContain("SKRIP_TEMA")
  })

  it("keempat area memakai lambang yang sama", () => {
    for (const f of [
      "src/app/login/page.tsx",
      "src/components/admin/admin-nav.tsx",
      "src/app/(user)/layout.tsx",
    ]) {
      expect(isi.get(f)).toMatch(/LogoPeser|MarkaPeser/)
    }
  })
})

describe("ikon aplikasi", () => {
  it("ikon tab memakai warna merek, bukan sisa bawaan Next.js", () => {
    // favicon.ico bawaan berwarna hitam-putih, sehingga tab peramban
    // menampilkan lambang yang sama sekali berbeda dari aplikasinya.
    expect(BERKAS.some((f) => f.endsWith("favicon.ico"))).toBe(false)
    const svg = readFileSync(join(AKAR, "src", "app", "icon.svg"), "utf8")
    expect(svg).toContain("#006c49")
  })

  it("ikon didaftarkan eksplisit di metadata", () => {
    // `icons` yang eksplisit membuat Next berhenti memindai konvensi berkas,
    // jadi icon.svg saja tidak cukup — tanpa baris ini tab tidak dapat ikon.
    expect(isi.get("src/app/layout.tsx")).toContain('url: "/icon.svg"')
  })
})

describe("umpan balik & gerak", () => {
  const TAG_KETUK = /<(Link|button|a)\b((?:[^>]|\n)*?)>/g

  it("galat dilaporkan lewat toast, bukan window.alert", () => {
    // Enam tabel admin memakai alert(apiError(err)) — modal peramban mentah,
    // memblokir, tanpa gaya, di luar sistem tampilan aplikasi — padahal
    // keenam FORM admin sudah memakai toast. Jadi menyimpan memunculkan toast
    // rapi sementara menghapus memunculkan alert. AGENTS.md melarang
    // window.confirm dengan alasan yang persis sama.
    const pelanggar = [...isi.entries()]
      .filter(([, teks]) => /(?:^|[^.\w])alert\(/.test(teks))
      .map(([f]) => f)
    expect(pelanggar).toEqual([])
  })

  it("kegagalan jaringan tidak berhenti di console", () => {
    // users-table hanya console.error saat GET /users gagal: admin melihat
    // tabel kosong tanpa keterangan dan menyangka memang belum ada akun.
    // error.tsx dikecualikan — di sana penggunanya sudah melihat UI galat dan
    // yang dicatat adalah digest untuk penelusuran.
    const pelanggar = [...isi.entries()]
      .filter(([f]) => f !== "src/app/error.tsx")
      .filter(([, teks]) => /console\.error/.test(teks))
      .map(([f]) => f)
    expect(pelanggar).toEqual([])
  })

  it("setiap target ketuk merespons saat DITEKAN, bukan cuma di-hover", () => {
    // Di HP tidak ada hover. 62 target ketuk di 39 berkas hanya punya
    // `hover:`, jadi tidak memberi umpan balik apa pun di bawah jari —
    // sementara area petugas dan warga justru yang mobile-first.
    const pelanggar: string[] = []
    for (const [f, teks] of isi) {
      for (const m of teks.matchAll(TAG_KETUK)) {
        const atr = m[2]
        if (!atr.includes("hover:")) continue
        if (atr.includes("active:") || atr.includes("tekan-halus")) continue
        pelanggar.push(`${f}:${teks.slice(0, m.index).split("\n").length}`)
      }
    }
    expect(pelanggar).toEqual([])
  })

  it("tekan-halus tidak bertabrakan dengan transition sendiri", () => {
    // Dua deklarasi transition-property tidak menyatu — yang belakangan
    // menimpa yang lain, jadi transform tekannya kehilangan transisi. Satu
    // utilitas memegang keduanya.
    const pelanggar: string[] = []
    for (const [f, teks] of isi) {
      for (const m of teks.matchAll(TAG_KETUK)) {
        if (m[2].includes("tekan-halus") && /\btransition-/.test(m[2])) {
          pelanggar.push(`${f}:${teks.slice(0, m.index).split("\n").length}`)
        }
      }
    }
    expect(pelanggar).toEqual([])
  })

  it("durasi & easing diambil dari token, tidak ditulis angka", () => {
    // globals.css sudah menyebut peruntukannya: slow untuk drawer/sheet,
    // normal untuk dialog/panel. Drawer admin dan backdrop dialog justru
    // memakai duration-300 + ease bawaan.
    const pelanggar = [...isi.entries()]
      .filter(([, teks]) => /\bduration-\d+\b|\bease-in-out\b/.test(teks))
      .map(([f]) => f)
    expect(pelanggar).toEqual([])
  })

  it("utilitas tekan-halus mematikan skalanya untuk prefers-reduced-motion", () => {
    // Aturan global hanya memendekkan durasi ke 1ms — transform-nya tetap
    // terjadi, cuma jadi lompatan mendadak, yang lebih buruk bagi orang yang
    // sensitif gerak (WCAG 2.3.3 menyoal gerak yang dipicu interaksi).
    const util = css.slice(css.indexOf("@utility tekan-halus"))
    const blok = util.slice(0, util.indexOf("\n}\n"))
    expect(blok).toContain("prefers-reduced-motion")
    expect(blok).toContain("transform: none")
  })

  it("useToast mengembalikan rujukan stabil", () => {
    // Sebelumnya ia mengembalikan objek literal baru setiap render, jadi
    // komponen yang menaruh `toast` di dependency array — sesuatu yang bahkan
    // diminta react-hooks/exhaustive-deps — mendapat fungsi baru tiap render
    // dan effect-nya berjalan tanpa henti. Di users-table itu berarti GET
    // /users berulang selamanya.
    expect(isi.get("src/components/ui/toast.tsx")).toMatch(
      /export function useToast\(\)[\s\S]{0,900}return useMemo\(/,
    )
  })
})

describe("skala ikon", () => {
  it("tidak ada ukuran ikon yang dikarang di tempat", () => {
    // size-[18px] dipakai 24x — di luar skala 4px Tailwind maupun baseline
    // 8px DESIGN.md — dan bertabrakan dengan peran yang sama: <Plus> di
    // tombol "Tambah" 7x pada 18px tapi 1x pada 16px, <Download> 3x vs 2x.
    // Button base-nova sendiri sudah menetapkan ikonnya size-4.
    const pelanggar = [...isi.entries()]
      .filter(([, teks]) => /\bsize-\[\d+px\]/.test(teks))
      .map(([f]) => f)
    expect(pelanggar).toEqual([])
  })

  it("ikon dekoratif disembunyikan dari pembaca layar", () => {
    // 43 dari 75 ikon belum punya aria-hidden — konvensinya sudah ada tapi
    // separuh terlewat. Tombolnya entah sudah punya teks di sebelahnya atau
    // sudah punya aria-label sendiri, jadi ikonnya hanya menambah kebisingan.
    const IKON =
      /<(ArrowRight|ArrowLeft|Recycle|Scale|Wallet|MapPin|Package|Truck|History|Home|UserRound|Activity|Search|ChevronLeft|ChevronRight|ChevronDown|ChevronUp|Plus|Pencil|Trash2|Eye|EyeOff|X|Check|Bell|LogOut|LogIn|Download|Upload|Camera|AlertTriangle|AlertCircle|Shield|RotateCcw|Save)(\s+[^>]*?)?\/>/g
    const pelanggar: string[] = []
    for (const [f, teks] of isi) {
      for (const m of teks.matchAll(IKON)) {
        if (m[0].includes("aria-hidden")) continue
        // Induk yang sudah aria-hidden membuat anaknya ikut tersembunyi.
        const sebelum = teks.slice(Math.max(0, m.index - 260), m.index)
        if (sebelum.split("\n").slice(-4).some((b) => b.includes("aria-hidden"))) continue
        pelanggar.push(`${f}:${teks.slice(0, m.index).split("\n").length}`)
      }
    }
    expect(pelanggar).toEqual([])
  })
})

describe("target sentuh", () => {
  it("tidak ada kontrol di bawah 44px tanpa perbesaran daerah tangkap", () => {
    // PRD §8.7 menetapkan 44px, dan proyek sudah punya TARGET_SENTUH_MIN_PX
    // beserta utilitas sentuh-nyaman. Sepuluh kontrol tetap di bawahnya: empat
    // h-10 di laporan, tombol ekspor/tambah di dua tabel, "Tandai semua
    // dibaca", dan dua tombol "Keluar" h-9 di bilah antrean — dua terakhir
    // justru di area petugas dan warga yang mobile-first.
    //
    // src/components/ui/* dikecualikan: primitifnya memang menyediakan varian
    // ukuran kecil, dan pemanggilnya yang memutuskan.
    const KECIL = /\b(h-[6-9]|h-10|size-[6-9]|size-10)\b/
    const TAG = /<(button|Link|a)\b((?:[^>]|\n)*?)>/g
    const pelanggar: string[] = []
    for (const [f, teks] of isi) {
      if (f.startsWith("src/components/ui/")) continue
      for (const m of teks.matchAll(TAG)) {
        const atr = m[2]
        if (!KECIL.test(atr)) continue
        if (atr.includes("sentuh-nyaman") || atr.includes("min-h-11")) continue
        pelanggar.push(`${f}:${teks.slice(0, m.index).split("\n").length}`)
      }
    }
    expect(pelanggar).toEqual([])
  })
})
