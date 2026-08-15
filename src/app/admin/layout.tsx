import type { Metadata } from "next";
import { Bell, Search, Settings, Shield, LogOut } from "lucide-react";

import { AdminSidebar } from "@/components/admin/admin-nav";

export const metadata: Metadata = {
  title: {
    default: "Admin — PESer",
    template: "%s — PESer",
  },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      {/* TopNavBar */}
      <nav className="fixed top-0 w-full z-50 bg-surface border-b border-outline-variant flex items-center justify-between px-6 h-16">
        <div className="flex items-center gap-4 w-1/3">
          <span className="font-headline-md text-headline-md font-bold text-primary">PESer</span>
          <div className="relative w-full max-w-sm ml-4 hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant size-4" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full h-10 pl-10 pr-4 rounded-full bg-surface-container-low border-transparent focus:border-primary focus:ring-1 focus:ring-primary text-sm text-on-surface placeholder:text-on-surface-variant outline-none transition-all"
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 w-1/3">
          <button
            type="button"
            aria-label="Notifications"
            className="p-2 rounded-full hover:bg-surface-container-low text-on-surface-variant transition-colors active:opacity-80"
          >
            <Bell className="size-5" />
          </button>
          <button
            type="button"
            aria-label="Settings"
            className="p-2 rounded-full hover:bg-surface-container-low text-on-surface-variant transition-colors active:opacity-80"
          >
            <Settings className="size-5" />
          </button>
          <div className="w-8 h-8 rounded-full overflow-hidden ml-2 cursor-pointer border border-outline-variant hover:border-primary transition-colors flex items-center justify-center bg-primary-container text-primary font-label-md text-label-md">
            AP
          </div>
        </div>
      </nav>

      {/* SideNavBar & Main Content Wrapper */}
      <div className="flex pt-16">
        {/* SideNavBar */}
        <aside className="fixed left-0 top-16 h-[calc(100vh-64px)] w-64 bg-surface-container-low border-r border-outline-variant flex flex-col py-6 gap-y-2 z-40 hidden md:flex">
          <div className="px-6 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-lg">
                P
              </div>
              <div>
                <h2 className="font-label-md text-label-md font-bold text-on-surface">PESer Admin</h2>
                <p className="font-label-sm text-label-sm text-on-surface-variant">Waste Management</p>
              </div>
            </div>
          </div>

          <AdminSidebar />

          <div className="px-4 mt-auto space-y-1">
            <a
              href="/admin/privacy"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-all duration-200 font-label-md text-label-md"
            >
              <Shield className="size-5 shrink-0" />
              <span>Privacy Policy</span>
            </a>
            <button
              type="button"
              className="w-full flex items-center justify-center gap-2 px-4 py-2 mt-4 text-error hover:bg-error-container hover:text-on-error-container rounded-lg font-label-md text-label-md transition-colors"
            >
              <LogOut className="size-5" />
              Logout
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main
          className="flex-1 md:ml-64 p-4 md:p-8 bg-background min-h-[calc(100vh-64px)] overflow-auto"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
