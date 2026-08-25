-- FR-E5 Notifikasi in-app. Dua pemicu yang ditetapkan PRD: stock melewati
-- threshold saat setoran selesai (§4.1 langkah 16) dan dispatch masuk ke
-- petugas pemilik (diagram urutan §6).
--
-- Satu baris PER PENERIMA: PRD menyebut penerimanya sebagai peran, bukan satu
-- akun, jadi kalau barisnya dibagi maka "dibacaPada" jadi ambigu — satu admin
-- membaca dan notifikasi itu hilang untuk admin lain.
--
-- Tanpa ON DELETE CASCADE, mengikuti aturan §7.1 untuk tabel non-master.

-- CreateEnum
CREATE TYPE "TipeNotifikasi" AS ENUM ('STOCK_THRESHOLD', 'DISPATCH_MASUK');

-- CreateTable
CREATE TABLE "notifikasi" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tipe" "TipeNotifikasi" NOT NULL,
    "judul" TEXT NOT NULL,
    "pesan" TEXT NOT NULL,
    "tautan" TEXT,
    "bankSampahId" TEXT,
    "dibacaPada" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "notifikasi_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notifikasi_userId_dibacaPada_createdAt_idx" ON "notifikasi"("userId", "dibacaPada", "createdAt");

-- CreateIndex
CREATE INDEX "notifikasi_bankSampahId_idx" ON "notifikasi"("bankSampahId");

-- AddForeignKey
ALTER TABLE "notifikasi" ADD CONSTRAINT "notifikasi_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifikasi" ADD CONSTRAINT "notifikasi_bankSampahId_fkey" FOREIGN KEY ("bankSampahId") REFERENCES "bank_sampah"("id") ON DELETE SET NULL ON UPDATE CASCADE;
