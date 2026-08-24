import { auth } from "@/auth"
import { NextResponse } from "next/server"

// Jalur di bawah /admin yang boleh diakses PETUGAS (FR-B7).
function isAdminExempt(pathname: string): boolean {
  return pathname === "/admin/nasabah" || pathname.startsWith("/admin/nasabah/")
}

export default auth((req) => {
  const { pathname } = req.nextUrl
  if (pathname.startsWith("/api")) return NextResponse.next()

  const isPublic = pathname === "/" || pathname === "/login"
  const isLoggedIn = !!req.auth

  if (!isLoggedIn && !isPublic) {
    return NextResponse.redirect(new URL("/login", req.nextUrl))
  }
  if (isLoggedIn && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl))
  }

  const role = req.auth?.user?.role

  // Panel /admin adalah Modul B — Master Data (ADMIN) di PRD, kecuali
  // /admin/nasabah yang FR-B7 tetapkan sebagai kewenangan PETUGAS.
  // role dibaca dari JWT (lihat callbacks di src/auth.ts), tanpa query DB.
  if (isLoggedIn && pathname.startsWith("/admin") && !isAdminExempt(pathname)) {
    if (role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.nextUrl))
    }
  }

  // Area /petugas adalah cerminannya: Modul C (setoran & stock) dan FR-D3..D5
  // milik PETUGAS. Admin diarahkan ke panelnya sendiri karena halaman di sini
  // selalu di-scope ke satu bank sampah, yang admin tidak punya (§5.3).
  if (isLoggedIn && pathname.startsWith("/petugas") && role !== "PETUGAS") {
    return NextResponse.redirect(new URL(role === "ADMIN" ? "/admin" : "/dashboard", req.nextUrl))
  }

  return NextResponse.next()
})

export const runtime = "nodejs"

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
