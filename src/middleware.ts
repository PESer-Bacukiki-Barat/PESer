import { auth } from "@/auth"
import { NextResponse } from "next/server"

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
  return NextResponse.next()
})

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
