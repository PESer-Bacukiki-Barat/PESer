"use server"

import { redirect } from "next/navigation"
import { AuthError } from "next-auth"

import { signIn, signOut } from "@/auth"
import { prisma } from "@/lib/prisma"

/**
 * Tujuan setelah masuk, per peran.
 *
 * Admin dan petugas tidak berbagi beranda: /petugas selalu di-scope ke satu
 * bank sampah yang admin tidak punya (§5.3), dan /admin sebaliknya.
 */
function berandaUntuk(role: string): string {
  return role === "ADMIN" ? "/admin" : "/petugas"
}

export async function login(formData: FormData) {
  const email = String(formData.get("email")).trim()
  const password = String(formData.get("password"))

  try {
    // `redirect: false` supaya signIn TIDAK melempar NEXT_REDIRECT di sini.
    // Perannya baru diketahui setelah kredensial terverifikasi, jadi tujuannya
    // tidak bisa ditentukan lewat `redirectTo` yang harus dipilih sebelum itu.
    //
    // Sebelum ini nilainya dipatok "/petugas" untuk semua orang, sehingga
    // setiap admin dipantul dua kali: sekali ke area yang bukan haknya, sekali
    // lagi kembali oleh middleware. Menggantinya dengan titik singgah netral
    // hanya memindahkan ongkos itu ke petugas. Cara ini tidak memantul siapa
    // pun.
    await signIn("credentials", { email, password, redirect: false })
  } catch (error) {
    if (error instanceof AuthError) {
      return redirect(`/login?error=${encodeURIComponent("Email atau password salah")}`)
    }
    throw error
  }

  // Sampai di sini kredensial sudah sah, jadi barisnya pasti ada. `?? "PETUGAS"`
  // hanya jaring pengaman: kalaupun meleset, ia mengarah ke area dengan hak
  // paling sempit, bukan ke panel admin.
  const user = await prisma.user.findUnique({
    where: { email, deletedAt: null },
    select: { role: true },
  })

  // redirect() melempar NEXT_REDIRECT, jadi ia harus di LUAR blok try di atas —
  // kalau di dalam, catch-nya akan menelannya dan halaman tidak pindah.
  redirect(berandaUntuk(user?.role ?? "PETUGAS"))
}

export async function logout() {
  await signOut({ redirectTo: "/login" })
}
