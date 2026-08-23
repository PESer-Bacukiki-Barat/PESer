-- schema.prisma sudah mendeklarasikan Dispatch.deletedAt (soft delete, BR-10 revisi)
-- beserta @@index([bankSampahId, deletedAt]), tapi belum ada migrasi yang membuatnya.
-- Tanpa ini setiap query dispatch yang memfilter deletedAt gagal dengan P2022
-- (ColumnNotFound), termasuk DELETE /api/dispatch/[id] yang melakukan soft delete.

-- AlterTable
ALTER TABLE "dispatch" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "dispatch_bankSampahId_deletedAt_idx" ON "dispatch"("bankSampahId", "deletedAt");
