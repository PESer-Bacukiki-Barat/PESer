-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'PETUGAS');

-- CreateEnum
CREATE TYPE "StatusDispatch" AS ENUM ('DRAFT', 'DISPATCHED', 'DITERIMA', 'DITOLAK', 'SERAH_TERIMA', 'SELESAI', 'DIBATALKAN');

-- CreateEnum
CREATE TYPE "TipeMutasi" AS ENUM ('MASUK', 'KELUAR', 'ADJUST');

-- CreateEnum
CREATE TYPE "KondisiSampah" AS ENUM ('BERSIH', 'KOTOR', 'CAMPUR');

-- CreateEnum
CREATE TYPE "StatusKoreksi" AS ENUM ('DIAJUKAN', 'DISETUJUI', 'DITOLAK');

-- CreateTable
CREATE TABLE "kelurahan" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "kodeWilayah" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kelurahan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_sampah" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "kelurahanId" TEXT NOT NULL,
    "alamat" TEXT NOT NULL,
    "latitude" DECIMAL(10,7) NOT NULL,
    "longitude" DECIMAL(10,7) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bank_sampah_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "authUserId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "bankSampahId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nasabah" (
    "id" TEXT NOT NULL,
    "kodeNasabah" TEXT NOT NULL,
    "bankSampahId" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "noHp" TEXT,
    "alamat" TEXT NOT NULL,
    "rt" TEXT NOT NULL,
    "rw" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nasabah_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jenis_sampah" (
    "id" TEXT NOT NULL,
    "kode" INTEGER NOT NULL,
    "nama" TEXT NOT NULL,
    "kategori" TEXT NOT NULL DEFAULT 'PLASTIK',
    "satuan" TEXT NOT NULL DEFAULT 'KG',
    "deskripsi" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jenis_sampah_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "harga_sampah" (
    "id" TEXT NOT NULL,
    "jenisSampahId" TEXT NOT NULL,
    "hargaBeli" DECIMAL(14,2) NOT NULL,
    "hargaJual" DECIMAL(14,2) NOT NULL,
    "berlakuMulai" TIMESTAMP(3) NOT NULL,
    "berlakuSampai" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "harga_sampah_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pembeli" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "perusahaan" TEXT,
    "noHp" TEXT NOT NULL,
    "alamat" TEXT NOT NULL,
    "catatan" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pembeli_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "setoran" (
    "id" TEXT NOT NULL,
    "kodeTransaksi" TEXT NOT NULL,
    "bankSampahId" TEXT NOT NULL,
    "nasabahId" TEXT NOT NULL,
    "petugasId" TEXT NOT NULL,
    "totalBerat" DECIMAL(10,2) NOT NULL,
    "totalNilai" DECIMAL(14,2) NOT NULL,
    "cashDibayar" BOOLEAN NOT NULL DEFAULT false,
    "tanggal" TIMESTAMP(3) NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "setoran_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "setoran_item" (
    "id" TEXT NOT NULL,
    "setoranId" TEXT NOT NULL,
    "jenisSampahId" TEXT NOT NULL,
    "berat" DECIMAL(10,2) NOT NULL,
    "hargaSaatItu" DECIMAL(14,2) NOT NULL,
    "subtotal" DECIMAL(14,2) NOT NULL,
    "kondisi" "KondisiSampah" NOT NULL,

    CONSTRAINT "setoran_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock" (
    "id" TEXT NOT NULL,
    "bankSampahId" TEXT NOT NULL,
    "jenisSampahId" TEXT NOT NULL,
    "berat" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "beratReservasi" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "threshold" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_mutation" (
    "id" TEXT NOT NULL,
    "stockId" TEXT NOT NULL,
    "tipe" "TipeMutasi" NOT NULL,
    "berat" DECIMAL(10,2) NOT NULL,
    "beratSebelum" DECIMAL(10,2) NOT NULL,
    "beratSesudah" DECIMAL(10,2) NOT NULL,
    "refType" TEXT NOT NULL,
    "refId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "keterangan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_mutation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "koreksi_stock" (
    "id" TEXT NOT NULL,
    "stockId" TEXT NOT NULL,
    "beratSelisih" DECIMAL(10,2) NOT NULL,
    "alasan" TEXT NOT NULL,
    "status" "StatusKoreksi" NOT NULL DEFAULT 'DIAJUKAN',
    "diajukanOlehId" TEXT NOT NULL,
    "disetujuiOlehId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "koreksi_stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dispatch" (
    "id" TEXT NOT NULL,
    "kodeDispatch" TEXT NOT NULL,
    "bankSampahId" TEXT NOT NULL,
    "pembeliId" TEXT NOT NULL,
    "dibuatOlehId" TEXT NOT NULL,
    "status" "StatusDispatch" NOT NULL DEFAULT 'DRAFT',
    "tanggalJemput" TIMESTAMP(3) NOT NULL,
    "totalNilai" DECIMAL(14,2),
    "alasanTolak" TEXT,
    "alasanSelisih" TEXT,
    "selisihSignifikan" BOOLEAN NOT NULL DEFAULT false,
    "fotoBuktiUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dispatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dispatch_item" (
    "id" TEXT NOT NULL,
    "dispatchId" TEXT NOT NULL,
    "jenisSampahId" TEXT NOT NULL,
    "beratTarget" DECIMAL(10,2) NOT NULL,
    "beratAktual" DECIMAL(10,2),
    "hargaJualPerKg" DECIMAL(14,2) NOT NULL,
    "subtotal" DECIMAL(14,2),

    CONSTRAINT "dispatch_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "aksi" TEXT NOT NULL,
    "entitas" TEXT NOT NULL,
    "entitasId" TEXT NOT NULL,
    "payloadBefore" JSONB,
    "payloadAfter" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "kelurahan_kodeWilayah_key" ON "kelurahan"("kodeWilayah");

-- CreateIndex
CREATE UNIQUE INDEX "bank_sampah_kelurahanId_key" ON "bank_sampah"("kelurahanId");

-- CreateIndex
CREATE UNIQUE INDEX "user_authUserId_key" ON "user"("authUserId");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE INDEX "user_bankSampahId_idx" ON "user"("bankSampahId");

-- CreateIndex
CREATE UNIQUE INDEX "nasabah_kodeNasabah_key" ON "nasabah"("kodeNasabah");

-- CreateIndex
CREATE INDEX "nasabah_bankSampahId_idx" ON "nasabah"("bankSampahId");

-- CreateIndex
CREATE UNIQUE INDEX "jenis_sampah_kode_key" ON "jenis_sampah"("kode");

-- CreateIndex
CREATE INDEX "harga_sampah_jenisSampahId_berlakuSampai_idx" ON "harga_sampah"("jenisSampahId", "berlakuSampai");

-- CreateIndex
CREATE UNIQUE INDEX "setoran_kodeTransaksi_key" ON "setoran"("kodeTransaksi");

-- CreateIndex
CREATE UNIQUE INDEX "setoran_idempotencyKey_key" ON "setoran"("idempotencyKey");

-- CreateIndex
CREATE INDEX "setoran_bankSampahId_tanggal_idx" ON "setoran"("bankSampahId", "tanggal");

-- CreateIndex
CREATE INDEX "setoran_item_setoranId_idx" ON "setoran_item"("setoranId");

-- CreateIndex
CREATE UNIQUE INDEX "stock_bankSampahId_jenisSampahId_key" ON "stock"("bankSampahId", "jenisSampahId");

-- CreateIndex
CREATE INDEX "stock_mutation_stockId_createdAt_idx" ON "stock_mutation"("stockId", "createdAt");

-- CreateIndex
CREATE INDEX "koreksi_stock_stockId_status_idx" ON "koreksi_stock"("stockId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "dispatch_kodeDispatch_key" ON "dispatch"("kodeDispatch");

-- CreateIndex
CREATE INDEX "dispatch_bankSampahId_status_idx" ON "dispatch"("bankSampahId", "status");

-- CreateIndex
CREATE INDEX "dispatch_item_dispatchId_idx" ON "dispatch_item"("dispatchId");

-- CreateIndex
CREATE INDEX "audit_log_entitas_entitasId_idx" ON "audit_log"("entitas", "entitasId");

-- CreateIndex
CREATE INDEX "audit_log_userId_createdAt_idx" ON "audit_log"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "bank_sampah" ADD CONSTRAINT "bank_sampah_kelurahanId_fkey" FOREIGN KEY ("kelurahanId") REFERENCES "kelurahan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_bankSampahId_fkey" FOREIGN KEY ("bankSampahId") REFERENCES "bank_sampah"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nasabah" ADD CONSTRAINT "nasabah_bankSampahId_fkey" FOREIGN KEY ("bankSampahId") REFERENCES "bank_sampah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "harga_sampah" ADD CONSTRAINT "harga_sampah_jenisSampahId_fkey" FOREIGN KEY ("jenisSampahId") REFERENCES "jenis_sampah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "setoran" ADD CONSTRAINT "setoran_bankSampahId_fkey" FOREIGN KEY ("bankSampahId") REFERENCES "bank_sampah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "setoran" ADD CONSTRAINT "setoran_nasabahId_fkey" FOREIGN KEY ("nasabahId") REFERENCES "nasabah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "setoran" ADD CONSTRAINT "setoran_petugasId_fkey" FOREIGN KEY ("petugasId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "setoran_item" ADD CONSTRAINT "setoran_item_setoranId_fkey" FOREIGN KEY ("setoranId") REFERENCES "setoran"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "setoran_item" ADD CONSTRAINT "setoran_item_jenisSampahId_fkey" FOREIGN KEY ("jenisSampahId") REFERENCES "jenis_sampah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock" ADD CONSTRAINT "stock_bankSampahId_fkey" FOREIGN KEY ("bankSampahId") REFERENCES "bank_sampah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock" ADD CONSTRAINT "stock_jenisSampahId_fkey" FOREIGN KEY ("jenisSampahId") REFERENCES "jenis_sampah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_mutation" ADD CONSTRAINT "stock_mutation_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "stock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_mutation" ADD CONSTRAINT "stock_mutation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "koreksi_stock" ADD CONSTRAINT "koreksi_stock_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "stock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "koreksi_stock" ADD CONSTRAINT "koreksi_stock_diajukanOlehId_fkey" FOREIGN KEY ("diajukanOlehId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "koreksi_stock" ADD CONSTRAINT "koreksi_stock_disetujuiOlehId_fkey" FOREIGN KEY ("disetujuiOlehId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispatch" ADD CONSTRAINT "dispatch_bankSampahId_fkey" FOREIGN KEY ("bankSampahId") REFERENCES "bank_sampah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispatch" ADD CONSTRAINT "dispatch_pembeliId_fkey" FOREIGN KEY ("pembeliId") REFERENCES "pembeli"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispatch" ADD CONSTRAINT "dispatch_dibuatOlehId_fkey" FOREIGN KEY ("dibuatOlehId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispatch_item" ADD CONSTRAINT "dispatch_item_dispatchId_fkey" FOREIGN KEY ("dispatchId") REFERENCES "dispatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispatch_item" ADD CONSTRAINT "dispatch_item_jenisSampahId_fkey" FOREIGN KEY ("jenisSampahId") REFERENCES "jenis_sampah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
