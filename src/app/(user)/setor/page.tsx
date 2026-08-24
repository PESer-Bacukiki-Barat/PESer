import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/auth";
import { SetorWargaForm, type JenisOpsi, type NasabahOpsi } from "@/components/user/setor-warga-form";

export const metadata: Metadata = {
  title: "Setor Sampah",
};

export const dynamic = "force-dynamic";

/**
 * Halaman setor warga — alur PRD §4.1 dengan nasabah = akun sendiri.
 * BR-16 tetap berlaku: jenis sampah berharga 0 tidak muncul di dropdown.
 */
export default async function SetorWargaPage() {
  const user = await getServerUser();
  if (!user?.bankSampah) redirect("/login");
  const bankSampahId = user.bankSampah.id;

  const nasabah = await prisma.nasabah.findFirst({
    where: {
      bankSampahId,
      deletedAt: null,
      ...(user.noHp ? { noHp: user.noHp } : {}),
    },
    orderBy: { createdAt: "asc" },
    select: { id: true, kodeNasabah: true, nama: true },
  });

  if (!nasabah) {
    return (
      <p className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 font-body-md text-body-md text-on-surface-variant">
        Nomor HP Anda belum terdaftar sebagai nasabah di bank sampah ini. Datang ke
        pos bank sampah untuk didaftarkan petugas lebih dulu — setelah itu form
        setor akan terbuka otomatis di halaman ini.
      </p>
    );
  }

  // BR-16: hanya jenis aktif berharga > 0 yang boleh masuk setoran.
  const jenisRows = await prisma.jenisSampah.findMany({
    where: { deletedAt: null, isActive: true, harga: { gt: 0 } },
    orderBy: { nama: "asc" },
    select: { id: true, nama: true, harga: true },
  });

  const jenis: JenisOpsi[] = jenisRows.map((j) => ({
    id: j.id,
    nama: j.nama,
    harga: Number(j.harga),
  }));

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
          Setor Sampah
        </h1>
        <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
          Timbang, pilih jenis per item, tunai diterima saat serah (BR-04).
        </p>
      </div>

      <SetorWargaForm
        nasabah={nasabah satisfies NasabahOpsi}
        jenis={jenis}
      />
    </div>
  );
}
