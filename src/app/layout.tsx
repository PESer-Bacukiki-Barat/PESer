import type { Metadata, Viewport } from "next";
import { Hanken_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { PenyediaToast } from "@/components/ui/toast";
import { SKRIP_TEMA } from "@/components/ui/penukar-tema";

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
      <head>
        {/* Berjalan sebelum halaman digambar: tanpa ini pengguna bertema
            gelap melihat kilatan putih di setiap muat halaman, karena React
            baru bisa memasang kelasnya setelah hydrate. */}
        <script dangerouslySetInnerHTML={{ __html: SKRIP_TEMA }} />
      </head>
      <body
        className="min-h-full flex flex-col"
        /**
         * Ekstensi peramban (Bitdefender Anti-tracker, Grammarly, dan
         * sejenisnya) menyuntikkan atribut seperti `bis_register` dan
         * `__processed_...` ke <body> SEBELUM React sempat hydrate, sehingga
         * React melaporkan ketidakcocokan untuk sesuatu yang tidak pernah
         * dikirim server.
         *
         * Ini escape hatch resmi React untuk kasus itu, dan sengaja hanya
         * dipasang di <body>: cakupannya satu tingkat, jadi ia tidak bisa
         * menutupi ketidakcocokan sungguhan di dalam pohon komponen.
         */
        suppressHydrationWarning
      ><PenyediaToast>{children}</PenyediaToast></body>
    </html>
  );
}
