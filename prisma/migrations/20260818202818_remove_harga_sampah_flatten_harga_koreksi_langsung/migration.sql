/*
  Warnings:

  - You are about to drop the column `beratSelisih` on the `koreksi_stock` table. All the data in the column will be lost.
  - You are about to drop the column `diajukanOlehId` on the `koreksi_stock` table. All the data in the column will be lost.
  - You are about to drop the column `disetujuiOlehId` on the `koreksi_stock` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `koreksi_stock` table. All the data in the column will be lost.
  - You are about to drop the `harga_sampah` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `beratSebelum` to the `koreksi_stock` table without a default value. This is not possible if the table is not empty.
  - Added the required column `beratSesudah` to the `koreksi_stock` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dilakukanOlehId` to the `koreksi_stock` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "harga_sampah" DROP CONSTRAINT "harga_sampah_jenisSampahId_fkey";

-- DropForeignKey
ALTER TABLE "koreksi_stock" DROP CONSTRAINT "koreksi_stock_diajukanOlehId_fkey";

-- DropForeignKey
ALTER TABLE "koreksi_stock" DROP CONSTRAINT "koreksi_stock_disetujuiOlehId_fkey";

-- DropIndex
DROP INDEX "koreksi_stock_stockId_status_idx";

-- AlterTable
ALTER TABLE "jenis_sampah" ADD COLUMN     "harga" DECIMAL(14,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "koreksi_stock" DROP COLUMN "beratSelisih",
DROP COLUMN "diajukanOlehId",
DROP COLUMN "disetujuiOlehId",
DROP COLUMN "status",
ADD COLUMN     "beratSebelum" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "beratSesudah" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "dilakukanOlehId" TEXT NOT NULL;

-- DropTable
DROP TABLE "harga_sampah";

-- DropEnum
DROP TYPE "StatusKoreksi";

-- CreateIndex
CREATE INDEX "koreksi_stock_stockId_idx" ON "koreksi_stock"("stockId");

-- AddForeignKey
ALTER TABLE "koreksi_stock" ADD CONSTRAINT "koreksi_stock_dilakukanOlehId_fkey" FOREIGN KEY ("dilakukanOlehId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
