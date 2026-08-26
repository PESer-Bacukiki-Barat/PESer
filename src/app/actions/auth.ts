"use server"

import { redirect } from "next/navigation"
import { AuthError } from "next-auth"
import { signIn, signOut } from "@/auth"

export async function login(formData: FormData) {
  const email = String(formData.get("email")).trim()
  const password = String(formData.get("password"))

  try {
    await signIn("credentials", { email, password, redirectTo: "/petugas" })
  } catch (error) {
    if (error instanceof AuthError) {
      return redirect(`/login?error=${encodeURIComponent("Email atau password salah")}`)
    }
    throw error
  }
}

export async function logout() {
  await signOut({ redirectTo: "/login" })
}
