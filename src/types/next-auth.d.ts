import type { DefaultSession } from "next-auth"

type AppRole = "ADMIN" | "PETUGAS"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role?: AppRole
    } & DefaultSession["user"]
  }

  interface User {
    role?: AppRole
  }
}

// next-auth v5 membungkus @auth/core; interface JWT yang sebenarnya dipakai
// callback ada di @auth/core/jwt, jadi augmentasi harus menyasar modul itu.
// Tanpa ini token.role bertipe unknown (JWT extends Record<string, unknown>).
declare module "@auth/core/jwt" {
  interface JWT {
    role?: AppRole
  }
}
