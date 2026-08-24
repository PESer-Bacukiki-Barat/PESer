/**
 * Pembentukan CSV — dipakai klien (unduh dari browser) DAN server
 * (GET /api/laporan/*?format=csv), supaya kedua jalur menghasilkan berkas
 * yang identik. Sebelumnya logika ini hanya ada di sisi klien.
 */

export type CsvColumn = { key: string; label: string }

function escapeCsv(value: unknown): string {
  const str = value == null ? "" : String(value)
  if (str.includes(",") || str.includes("\n") || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

/**
 * Byte Order Mark UTF-8.
 *
 * Tanpa ini Excel di Windows membaca CSV sebagai ANSI, sehingga nama seperti
 * "Cappa Galung" masih aman tapi karakter non-ASCII rusak. Audiens laporan ini
 * membukanya di Excel, jadi BOM-nya disengaja.
 */
export const CSV_BOM = "﻿"

/** Bangun isi CSV sebagai string. Murni, tanpa sentuhan DOM. */
export function buildCsv(
  rows: Record<string, unknown>[],
  headers?: CsvColumn[],
): string {
  const cols: CsvColumn[] = headers
    ? headers
    : rows.length > 0
      ? Object.keys(rows[0]).map((k) => ({ key: k, label: k }))
      : []

  const headerRow = cols.map((c) => escapeCsv(c.label)).join(",")
  const bodyRows = rows.map((row) => cols.map((c) => escapeCsv(row[c.key])).join(","))
  return [headerRow, ...bodyRows].join("\n")
}

/** Unduh CSV dari browser. Hanya boleh dipanggil di Client Component. */
export function exportToCsv(
  filename: string,
  rows: Record<string, unknown>[],
  headers?: CsvColumn[],
): void {
  const csv = CSV_BOM + buildCsv(rows, headers)
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)

  const a = document.createElement("a")
  a.href = url
  a.download = `${filename}.csv`
  a.style.display = "none"
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
