import type { Metadata } from "next";
import { Bell, HelpCircle, LogOut, Menu, Search, Settings } from "lucide-react";

import { AdminMobileNav, AdminSidebar } from "@/components/admin/admin-nav";

export const metadata: Metadata = {
  title: {
    default: "Admin — PESer",
    template: "%s — PESer",
  },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="min-h-screen flex flex-col bg-background font-sans md:flex-row">
      {/* Mobile TopAppBar */}
      <header className="md:hidden bg-surface dark:bg-background text-primary dark:text-primary-fixed border-b border-outline-variant dark:border-outline flex justify-between items-center w-full px-4 h-16 sticky top-0 z-50">
        <button
          type="button"
          className="hover:bg-surface-container-low dark:hover:bg-surface-container-highest transition-colors p-2 rounded-full active:opacity-80 active:scale-95"
          aria-label="Menu"
        >
          <Menu className="text-on-surface-variant dark:text-surface-variant size-6" />
        </button>
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-primary dark:text-inverse-primary">
          PESer
        </h1>
        <button
          type="button"
          className="hover:bg-surface-container-low dark:hover:bg-surface-container-highest transition-colors p-2 rounded-full active:opacity-80 active:scale-95"
          aria-label="Notifikasi"
        >
          <Bell className="text-on-surface-variant dark:text-surface-variant size-6" />
        </button>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-outline-variant bg-surface-container-lowest h-screen sticky top-0">
        <div className="h-16 flex items-center px-6 border-b border-outline-variant">
          <h1 className="font-headline-lg text-headline-lg text-primary">PESer</h1>
        </div>
        <AdminSidebar />
        <div className="p-4 border-t border-outline-variant">
          <a
            href="/admin/pengaturan"
            className="flex items-center space-x-3 px-3 py-2 rounded-lg text-on-surface-variant hover:bg-surface-container-low transition-colors font-label-md text-label-md"
          >
            <Settings className="size-5 shrink-0" />
            <span>Pengaturan</span>
          </a>
          <a
            href="/admin/logout"
            className="flex items-center space-x-3 px-3 py-2 rounded-lg text-error hover:bg-error-container transition-colors mt-2 font-label-md text-label-md"
          >
            <LogOut className="size-5 shrink-0" />
            <span>Logout</span>
          </a>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Desktop TopNav */}
        <header className="hidden md:flex h-16 border-b border-outline-variant bg-surface-container-lowest items-center justify-between px-8 sticky top-0 z-40">
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant size-4" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-full text-on-surface focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-all font-label-md text-label-md"
            />
          </div>
          <div className="flex items-center space-x-4">
            <button
              type="button"
              className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors relative"
              aria-label="Notifikasi"
            >
              <Bell className="size-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full" />
            </button>
            <button
              type="button"
              className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors"
              aria-label="Bantuan"
            >
              <HelpCircle className="size-5" />
            </button>
            <div className="flex items-center space-x-2 pl-4 border-l border-outline-variant">
              <div className="w-8 h-8 rounded-full bg-primary-container text-primary flex items-center justify-center font-label-md text-label-md">
                AP
              </div>
              <div className="hidden lg:block">
                <p className="font-label-md text-label-md text-on-surface">Admin Pusat</p>
                <p className="text-xs text-on-surface-variant">Administrator</p>
              </div>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-8 flex-1 overflow-auto">{children}</div>
      </main>

      {/* Mobile BottomNav */}
      <AdminMobileNav />
    </div>
  );
}
