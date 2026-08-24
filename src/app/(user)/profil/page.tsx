import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CircleUserRound } from "lucide-react";

import { getServerUser } from "@/lib/auth";
import { logout } from "@/app/actions/auth";
import { ProfilForm, type Profil } from "@/components/profil/profil-form";

export const metadata: Metadata = {
  title: "Profil",
};

export const dynamic = "force-dynamic";

/**
 * Profil warga — FR-A2 (ubah nama & password sendiri) memakai form yang sama
 * dengan panel admin/petugas. Menu Bantuan/Pengaturan/Sertifikat dari mockup
 * lama dihapus: tidak ada padanannya di PRD.
 */
export default async function ProfilUserPage() {
  const user = await getServerUser();
  if (!user) redirect("/login");

  const profil: Profil = {
    nama: user.nama,
    email: user.email,
    role: user.role,
    bankSampah: user.bankSampah ? { nama: user.bankSampah.nama } : null,
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Kartu identitas — Secondary sebagai deep background (DESIGN.md) */}
      <div className="rounded-xl bg-gradient-to-br from-secondary to-primary p-4 text-on-primary shadow-md">
        <div className="flex items-center gap-4">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-on-primary/15">
            <CircleUserRound className="size-8" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="truncate font-headline-md text-[16px] font-semibold">
              {user.nama}
            </p>
            <p className="font-mono text-xs text-on-primary/80">{user.email}</p>
            <p className="font-mono text-xs text-on-primary/80">
              {user.noHp ?? "Nomor HP belum diisi"}
            </p>
          </div>
        </div>
      </div>

      <ProfilForm profil={profil} />

      <form action={logout}>
        <button
          type="submit"
          className="h-12 min-h-11 w-full rounded-full border border-outline-variant font-label-md text-label-md font-medium text-error transition-colors hover:bg-error-container/40 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/50"
        >
          Keluar
        </button>
      </form>

      <p className="text-center font-mono font-label-sm text-label-sm text-on-surface-variant">
        PESer · Waste is Value
      </p>
    </div>
  );
}
