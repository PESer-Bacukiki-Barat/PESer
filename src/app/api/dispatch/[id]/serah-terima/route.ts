import { jalankanTransisi, pakaiSchema, beratAktualSchema } from "../aksi"

/**
 * POST /api/dispatch/:id/serah-terima — DITERIMA -> SERAH_TERIMA
 * (PETUGAS pemilik, FR-D4 & FR-D5). Di sinilah BR-11 berlaku: berat berkurang
 * dan reservasi dilepas secara atomik.
 */
export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  return jalankanTransisi(
    request,
    ctx,
    "SERAH_TERIMA",
    pakaiSchema(beratAktualSchema, (d) => ({
      beratAktual: d.beratAktual,
      alasanSelisih: d.alasanSelisih,
    })),
  )
}
