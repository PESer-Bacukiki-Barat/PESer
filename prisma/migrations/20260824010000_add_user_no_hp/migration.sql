-- User.noHp — jangkar penautan akun ke Nasabah untuk area warga (user).
-- PRD §1.3 tidak membuat akun warga, jadi penautan dilakukan lewat noHp yang
-- sama di bank sampah tempat akun ditugaskan; nullable karena admin/petugas
-- tidak butuh penautan ini.

-- AlterTable
ALTER TABLE "user" ADD COLUMN "noHp" TEXT;
