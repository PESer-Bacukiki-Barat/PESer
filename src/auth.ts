import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "").trim()
        const password = String(credentials?.password ?? "")
        if (!email || !password) return null

        const { prisma } = await import("@/lib/prisma")
        const credential = await prisma.credential.findUnique({
          where: { email, deletedAt: null },
          include: { user: true },
        })
        if (!credential || credential.user.deletedAt || !credential.user.isActive) return null

        const ok = await bcrypt.compare(password, credential.passwordHash)
        if (!ok) return null

        return {
          id: credential.user.id,
          name: credential.user.nama,
          email: credential.user.email,
          role: credential.user.role,
        }
      },
    }),
  ],
  callbacks: {
    // role dititipkan ke JWT saat login supaya middleware bisa memeriksa
    // otorisasi tanpa query database di setiap request.
    jwt({ token, user }) {
      if (user) token.role = user.role
      return token
    },
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub
      if (token.role) session.user.role = token.role
      return session
    },
  },
})
