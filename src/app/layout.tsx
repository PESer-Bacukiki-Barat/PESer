import type { Metadata, Viewport } from "next";
import { Hanken_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Peser — Bank Sampah Digital",
  description: "Bank Sampah Digital Kecamatan",
  // Next menautkan /manifest.webmanifest sendiri dari app/manifest.ts, tapi
  // dua hal berikut tidak otomatis dan dibutuhkan agar bisa dipasang di iOS.
  appleWebApp: {
    capable: true,
    title: "PESer",
    statusBarStyle: "default",
  },
  icons: {
    apple: "/icons/apple-touch-icon.png",
  },
};

/**
 * themeColor mewarnai bilah browser di HP. Sejak Next 15 ia pindah dari
 * metadata ke export viewport tersendiri; menaruhnya di metadata hanya
 * menghasilkan peringatan dan diabaikan.
 */
export const viewport: Viewport = {
  themeColor: "#006c49",
  // Tanpa viewport-fit=cover, env(safe-area-inset-*) SELALU bernilai 0 dan
  // seluruh penyesuaian gesture bar iOS tidak berpengaruh apa pun. Aplikasi
  // ini dipasang sebagai PWA di HP petugas, jadi itu bukan detail kecil.
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={cn(
        "h-full",
        "antialiased",
        hanken.variable,
        jetbrainsMono.variable,
        "font-sans",
      )}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
