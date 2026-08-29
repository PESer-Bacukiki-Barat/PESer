import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-nav";
import { getServerUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: {
    default: "Admin — PESer",
    template: "%s — PESer",
  },
};

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  // Nama dan email dibaca di server lalu diteruskan ke shell. Sebelumnya
  // topbar menampilkan inisial "AP" yang di-hardcode — bukan milik siapa pun
  // yang sedang masuk.
  const user = await getServerUser();
  if (!user) redirect("/login");

  return (
    <AdminShell nama={user.nama} email={user.email}>
      {children}
    </AdminShell>
  );
}
