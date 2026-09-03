import Link from "next/link";
import { redirect } from "next/navigation";

import { getServerUser } from "@/lib/auth";
import { logout } from "@/app/actions/auth";
import { UserBottomNav } from "@/components/user/bottom-nav";
import { BadgeAntrean, TombolKeluar } from "@/components/user/bar-antrean";
import { AntreanProvider } from "@/components/petugas/antrean-provider";
import { MarkaPeser } from "@/components/brand/logo-peser";

/**
 * Shell aplikasi warga/user (mobile-first, DESIGN.md: bottom tab bar dengan
 * tombol Setor elevated). Middleware hanya menjamin sudah login; di sini
 * dijaga syarat BR-02 — seluruh data halaman ini di-scope ke satu bank sampah,
 * jadi akun tanpa penugasan tidak punya apa pun untuk dilihat.
 */
export default async function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getServerUser();
  if (!user) redirect("/login");
  if (!user.bankSampah) {
    return (
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-10">
        <div className="rounded-xl border border-error bg-error-container/40 p-5">
          <h1 className="text-title-md text-on-error-container mb-1">
            Belum terhubung bank sampah
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Akun Anda belum terikat ke bank sampah mana pun, jadi setoran belum
            bisa dibuka. Hubungi petugas atau admin kecamatan (BR-02).
          </p>
          <form action={logout} className="mt-4">
            <button
              type="submit"
              className="tekan-halus h-11 w-full rounded-lg border border-outline-variant font-label-md text-label-md text-on-surface hover:bg-surface-container-low"
            >
              Keluar
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    // Satu antrean offline untuk seluruh area: badge di header dan form setor
    // membagi state yang sama (§4.3 aturan 5–6).
    <AntreanProvider>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b border-outline-variant bg-surface-container-lowest/95 backdrop-blur">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            {/* Header sekaligus jalan masuk ke profil: bottom nav penuh lima
                slot dan menambah keenam akan memecah TARGET_SENTUH_MIN_PX. */}
            <Link
              href="/profil"
              className="tekan-halus -mx-1 flex min-w-0 items-center gap-2.5 rounded-lg px-1 hover:bg-surface-container-low focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/50"
            >
              {/* Lambang yang sama dengan layar masuk dan panel admin —
                  sebelumnya area ini satu-satunya yang tanpa identitas apa
                  pun, jadi terasa seperti aplikasi yang berbeda. */}
              <span
                aria-hidden
                className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-on-primary shadow-sm"
              >
                <MarkaPeser className="size-5" />
              </span>
              <span className="min-w-0">
                <span className="block truncate font-label-sm text-label-sm text-on-surface-variant">
                  Selamat datang,
                </span>
                <span className="block truncate text-title-sm text-on-surface">
                  {user.nama}
                </span>
              </span>
            </Link>
            <div className="flex shrink-0 items-center gap-2">
              <BadgeAntrean />
              <TombolKeluar />
            </div>
          </div>
        </header>

        {/* pb-aman = ruang bottom nav fixed + gesture bar iOS */}
        <main className="masuk flex-1 px-4 pt-4 pb-aman">{children}</main>

        <UserBottomNav />
      </div>
    </AntreanProvider>
  );
}
