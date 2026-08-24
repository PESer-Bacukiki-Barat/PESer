import { laporanPenjualan, penjualanKeCsv } from "@/lib/laporan"
import { laporanHandler, sufiksPeriode } from "../shared"

/**
 * GET /api/laporan/penjualan — FR-E4, terdaftar di tabel endpoint PRD §2.5.
 *
 * Hanya menghitung dispatch berstatus SELESAI. Itu bukan penyempitan sembarangan:
 * BR-13 menetapkan SELESAI final, jadi baris yang sudah masuk laporan tidak bisa
 * berubah — memenuhi G6 "tanpa selisih retroaktif" secara struktural.
 */
export async function GET(request: Request) {
  return laporanHandler(request, {
    namaBerkas: `laporan-penjualan-${sufiksPeriode(new URL(request.url))}`,
    ambil: laporanPenjualan,
    keCsv: penjualanKeCsv,
  })
}
