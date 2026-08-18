import type { Metadata } from "next";

import { AdminShell } from "@/components/admin/admin-nav";

export const metadata: Metadata = {
  title: {
    default: "Admin — PESer",
    template: "%s — PESer",
  },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <AdminShell>{children}</AdminShell>;
}
