import { laporanVolume, volumeKeCsv } from "@/lib/laporan"
import { laporanHandler, sufiksPeriode } from "../shared"

/**
 * GET /api/laporan/volume — FR-E3 "Laporan volume masuk per periode".
 *
 * Tidak tercantum di tabel endpoint §2.5 (yang hanya menyebut penjualan), tapi
 * FR-E3 memintanya dan volumenya berasal dari sumber berbeda (Setoran, bukan
 * Dispatch), jadi tidak bisa digabung ke satu endpoint tanpa mencampur dua hal.
 */
export async function GET(request: Request) {
  return laporanHandler(request, {
    namaBerkas: `laporan-volume-${sufiksPeriode(new URL(request.url))}`,
    ambil: laporanVolume,
    keCsv: volumeKeCsv,
  })
}
