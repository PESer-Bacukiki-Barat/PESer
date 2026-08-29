-- FR-C2 (gerbang kualitas) dan FR-D5 (foto bukti serah terima). PRD v1.6.
--
-- Dua aturan PRD ditegakkan di level database lewat CHECK, bukan hanya di zod:
-- validasi aplikasi bisa dilewati oleh skrip, seed, atau perbaikan manual,
-- sedangkan CHECK berlaku untuk semua penulis tanpa kecuali.

-- CreateEnum
CREATE TYPE "AlasanTolak" AS ENUM ('TIDAK_TERSORTIR', 'TIDAK_SESUAI_MASTER', 'TERKONTAMINASI', 'LAINNYA');

-- CreateTable
-- BR-18: barang tolakan disimpan TERPISAH dari setoran_item supaya tidak
-- mungkin ikut terhitung ke stock, pembayaran, maupun laporan volume.
CREATE TABLE "setoran_ditolak" (
    "id" TEXT NOT NULL,
    "setoranId" TEXT NOT NULL,
    "jenisSampahId" TEXT,
    "deskripsi" TEXT NOT NULL,
    "berat" DECIMAL(10,2) NOT NULL,
    "alasan" "AlasanTolak" NOT NULL,
    "catatan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "setoran_ditolak_pkey" PRIMARY KEY ("id")
);

-- BR-08: berat selalu positif. Penolakan 0 kg tidak berarti apa-apa.
ALTER TABLE "setoran_ditolak"
  ADD CONSTRAINT "setoran_ditolak_berat_positif" CHECK ("berat" > 0);

-- PRD §4.1: alasan LAINNYA mewajibkan catatan diisi, karena tanpa itu
-- penolakannya tidak bisa ditinjau kemudian.
ALTER TABLE "setoran_ditolak"
  ADD CONSTRAINT "setoran_ditolak_lainnya_butuh_catatan"
  CHECK ("alasan" <> 'LAINNYA' OR ("catatan" IS NOT NULL AND btrim("catatan") <> ''));

-- Deskripsi tidak boleh kosong/spasi: itu satu-satunya catatan tentang barang
-- yang sudah telanjur dikembalikan ke warga.
ALTER TABLE "setoran_ditolak"
  ADD CONSTRAINT "setoran_ditolak_deskripsi_terisi" CHECK (btrim("deskripsi") <> '');

-- CreateIndex
CREATE INDEX "setoran_ditolak_setoranId_idx" ON "setoran_ditolak"("setoranId");

-- AddForeignKey
ALTER TABLE "setoran_ditolak" ADD CONSTRAINT "setoran_ditolak_setoranId_fkey" FOREIGN KEY ("setoranId") REFERENCES "setoran"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "setoran_ditolak" ADD CONSTRAINT "setoran_ditolak_jenisSampahId_fkey" FOREIGN KEY ("jenisSampahId") REFERENCES "jenis_sampah"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- CreateTable
-- BR-19: isi foto disimpan di Postgres. Barisnya dipisah dari dispatch supaya
-- kolom bytea yang besar tidak ikut terbaca setiap kali dispatch di-query.
CREATE TABLE "foto_bukti" (
    "id" TEXT NOT NULL,
    "dispatchId" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "ukuran" INTEGER NOT NULL,
    "data" BYTEA NOT NULL,
    "diunggahOlehId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "foto_bukti_pkey" PRIMARY KEY ("id")
);

-- Tipe dibatasi di database juga, bukan hanya di route: berkas yang bukan
-- gambar tidak boleh pernah tersimpan dan lalu disajikan kembali.
ALTER TABLE "foto_bukti"
  ADD CONSTRAINT "foto_bukti_mime_gambar"
  CHECK ("mimeType" IN ('image/jpeg', 'image/png', 'image/webp'));

-- Batas 1 MB sesuai BR-19; nilai yang sama ada di src/lib/constants.ts.
ALTER TABLE "foto_bukti"
  ADD CONSTRAINT "foto_bukti_ukuran_wajar" CHECK ("ukuran" > 0 AND "ukuran" <= 1048576);

-- CreateIndex
CREATE UNIQUE INDEX "foto_bukti_dispatchId_key" ON "foto_bukti"("dispatchId");

-- CreateIndex
CREATE INDEX "foto_bukti_diunggahOlehId_idx" ON "foto_bukti"("diunggahOlehId");

-- AddForeignKey
ALTER TABLE "foto_bukti" ADD CONSTRAINT "foto_bukti_dispatchId_fkey" FOREIGN KEY ("dispatchId") REFERENCES "dispatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "foto_bukti" ADD CONSTRAINT "foto_bukti_diunggahOlehId_fkey" FOREIGN KEY ("diunggahOlehId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
