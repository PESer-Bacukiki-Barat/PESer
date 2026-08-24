import Link from "next/link"
import type { Metadata } from "next";
import { ChevronRight } from "lucide-react";

import { UsersTable } from "@/components/admin/users-table";

export const metadata: Metadata = {
  title: "Manajemen Users",
};

export default function UsersPage() {
  return (
    <>
      {/* Breadcrumbs */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-2 text-on-surface-variant font-label-sm text-label-sm mb-6"
      >
        <Link className="hover:text-primary transition-colors" href="/admin">
          Dashboard
        </Link>
        <ChevronRight className="size-4" />
        <span className="text-on-surface font-semibold">Manajemen Users</span>
      </nav>

      {/* Header */}
      <div className="mb-6">
        <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-2">
          Manajemen Users
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
          Kelola seluruh akun user sistem (admin dan petugas), hak akses, serta bank sampah
          yang ditangani masing-masing.
        </p>
      </div>

      <UsersTable />
    </>
  );
}
