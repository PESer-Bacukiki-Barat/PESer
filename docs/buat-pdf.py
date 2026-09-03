"""
Merender docs/panduan-peser.html menjadi docs/PANDUAN-PESer.pdf.

Cara pakai:

    npm run build          # sekali, supaya berkas font next/font tersedia
    python docs/buat-pdf.py
    chrome --headless=new --disable-gpu --no-pdf-header-footer       --print-to-pdf=docs/PANDUAN-PESer.pdf docs/panduan-cetak.html

Skrip ini hanya menyiapkan panduan-cetak.html: dokumen HTML utuh berisi
gaya khusus cetak dan keempat berkas font Latin yang ditanam sebagai data
URI. Penanaman itu perlu karena peramban headless sering dijalankan tanpa
jaringan, sehingga <link> ke Google Fonts gagal senyap dan hurufnya jatuh
ke huruf bawaan sistem. Berkas fontnya diambil dari hasil `npm run build`
— next/font sudah mengunduh dan meng-host sendiri Hanken Grotesk dan
JetBrains Mono di sana.
"""

import base64, io, os

# Jalur diturunkan dari lokasi skrip ini, jadi repo boleh dipindah ke mana pun.
SINI = os.path.dirname(os.path.abspath(__file__))
AKAR = os.path.dirname(SINI)
D = SINI
MEDIA = os.path.join(AKAR, ".next", "static", "media")

sumber = io.open(f"{D}/panduan-peser.html", encoding="utf-8").read()

# Berkas artefak ditulis tanpa doctype/head/body karena pembungkusnya yang
# menyediakannya. Untuk dicetak ia perlu jadi dokumen utuh.
potong = sumber.index('<div class="bingkai">')
kepala = sumber[:potong]
badan = sumber[potong:]

# Tautan ke Google Fonts dibuang: Chrome headless di sini tanpa jaringan, jadi
# tautan itu gagal senyap dan hurufnya jatuh ke Segoe UI. Font aslinya sudah
# ada di lokal — next/font mengunduh dan meng-host sendiri saat build — jadi
# ditanam langsung supaya PDF-nya mandiri dan memakai huruf yang benar.
kepala = "\n".join(
    b for b in kepala.split("\n") if "fonts.googleapis.com" not in b
)

# Keduanya font variabel (satu berkas untuk semua ketebalan), dipecah per
# subset unicode. Latin + Latin-Extended cukup untuk teks Indonesia beserta
# tanda pisah dan titik tengah yang dipakai panduan ini.
FONT = [
    ("Hanken Grotesk", "c47649aa31f9e140-s.p.3lxpqujs87tck.woff2", "100 900",
     "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,"
     "U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,"
     "U+2212,U+2215,U+FEFF,U+FFFD"),
    ("Hanken Grotesk", "8b4ed0a90d903ab5-s.44dak0sams9f0.woff2", "100 900",
     "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,"
     "U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,"
     "U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF"),
    ("JetBrains Mono", "70bc3e132a0a741e-s.p.3t6q91iet4nsy.woff2", "100 800",
     "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,"
     "U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,"
     "U+2212,U+2215,U+FEFF,U+FFFD"),
    ("JetBrains Mono", "3fe682a82f50d426-s.0vfdmo25voy_0.woff2", "100 800",
     "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,"
     "U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,"
     "U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF"),
]

potongan = []
for nama, berkas, berat, rentang in FONT:
    jalur = os.path.join(MEDIA, berkas)
    assert os.path.exists(jalur), f"font tidak ada: {jalur}"
    b64 = base64.b64encode(io.open(jalur, "rb").read()).decode("ascii")
    potongan.append(
        "@font-face{font-family:'%s';font-style:normal;font-weight:%s;"
        "font-display:block;src:url(data:font/woff2;base64,%s) format('woff2');"
        "unicode-range:%s}" % (nama, berat, b64, rentang)
    )
FONT_CSS = "<style>\n" + "\n".join(potongan) + "\n</style>\n"

# ─────────────────────────────────────────────────────────── gaya cetak
# data-theme="light" di <html> mematikan blok gelap sepenuhnya: media
# query-nya sudah dijaga :root:not([data-theme="light"]). Jadi tidak perlu
# menimpa satu per satu tokennya.
CETAK = """
<style>
  /* ══════════════════ khusus cetak / PDF ══════════════════ */
  @page { size: A4; margin: 17mm 15mm 16mm; }

  html, body {
    background: #ffffff;
    font-size: 10.5pt;
    line-height: 1.5;
  }

  /* Warna latar (rel status, kotak catatan, rel aksen peran) harus ikut
     tercetak — tanpa ini semuanya jadi putih dan penandanya hilang. */
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }

  /* Satu kolom: sidebar menempel tidak ada artinya di atas kertas. */
  .bingkai { display: block; max-width: none; padding: 0; }

  /* ── Halaman judul ── */
  .masthead {
    padding: 4mm 0 8mm;
    margin-bottom: 9mm;
    border-bottom: 1.5px solid var(--primer);
  }
  .masthead h1 { font-size: 30pt; line-height: 1.05; margin-bottom: 6mm; }
  .dek { font-size: 12pt; line-height: 1.5; }
  .meta-baris { margin-top: 7mm; font-size: 8.5pt; gap: 4px 18px; }
  .marka { width: 30px; height: 30px; }
  .marka svg { width: 18px; height: 18px; }

  /* ── Daftar isi: satu halaman sendiri, bab mulai dari halaman baru ── */
  .toc {
    position: static; max-height: none; overflow: visible;
    margin: 0 0 4mm; break-after: page;
  }
  .toc ol { gap: 0; }
  .toc a {
    padding: 4.5px 0;
    border-bottom: 1px solid var(--garis-halus);
    border-left: none; border-radius: 0;
    font-size: 10.5pt; color: var(--tinta);
  }
  .toc a .n { font-size: 8.5pt; min-width: 20px; }

  /* ── Bab ── */
  .bab { margin-bottom: 9mm; padding-top: 0; }
  /* Judul bab tidak boleh tertinggal sendiri di dasar halaman. */
  .bab-kepala { break-after: avoid; break-inside: avoid; margin-bottom: 3mm; }
  .bab h2 { font-size: 17pt; }
  .bab h3 { font-size: 12pt; margin: 6mm 0 2.5mm; break-after: avoid; }
  .bab p, .bab ul, .bab ol { orphans: 3; widows: 3; }
  .pengantar { font-size: 11.5pt; margin-bottom: 5mm !important; }
  .bab > p, .bab > ul, .bab > ol { max-width: none; }

  /* ── Blok yang tidak boleh terbelah ── */
  .peran, .nota, .rel-bungkus, .kamus > div, .langkah > li { break-inside: avoid; }
  tr, thead { break-inside: avoid; }
  thead { display: table-header-group; }

  .peran-grid { grid-template-columns: repeat(3, 1fr); gap: 4mm; margin: 5mm 0 3mm; }
  .peran { padding: 4mm; gap: 2.5mm; }
  .peran h3 { font-size: 12pt; }
  .peran p, .peran dd { font-size: 9pt; }

  .langkah { margin: 5mm 0; max-width: none; }
  .langkah > li { padding-bottom: 4.5mm; }
  .langkah h4 { font-size: 11pt; break-after: avoid; }
  .langkah p { font-size: 10pt; }

  .nota { max-width: none; padding: 3.5mm 4mm; margin: 5mm 0; font-size: 9.5pt; }
  .kamus, .tabel-bungkus { max-width: none; }

  /* Rel status: di kertas A4 ia harus muat, jadi dikecilkan alih-alih
     digulir — tidak ada gulir di atas kertas. */
  .rel-bungkus { overflow: visible; }
  .rel { min-width: 0; }
  .rel-simpul { font-size: 7.4pt; padding: 5px 6px; }
  .rel-panah { width: 12px; }
  .rel-aktor { font-size: 6.6pt; }
  .cabang span { font-size: 8.5pt; }

  table { min-width: 0; }
  th, td { padding: 6px 9px; font-size: 9.3pt; }
  th { font-size: 7.6pt; }
  code { font-size: 0.87em; padding: 0.5px 3px; }

  .kaki {
    border-top: 1px solid var(--garis);
    padding-top: 4mm; margin-top: 6mm;
    font-size: 8pt; break-inside: avoid;
  }

  /* Tautan dalam dokumen tidak perlu diwarnai di atas kertas. */
  a { color: inherit; text-decoration: none; }
  html { scroll-behavior: auto; }
</style>
"""

dok = (
    "<!doctype html>\n"
    '<html lang="id" data-theme="light">\n'
    "<head>\n"
    '<meta charset="utf-8">\n'
    '<meta name="viewport" content="width=device-width, initial-scale=1">\n'
    + FONT_CSS
    + kepala
    + CETAK
    + "</head>\n<body>\n"
    + badan
    + "\n</body>\n</html>\n"
)

keluar = f"{D}/panduan-cetak.html"
io.open(keluar, "w", encoding="utf-8", newline="").write(dok)
print(f"dibuat: {keluar}")
print(f"  {len(dok):,} bytes ({len(FONT)} font tertanam)")
