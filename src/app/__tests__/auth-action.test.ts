/**
 * Server Action login — tujuan setelah masuk.
 *
 * Perannya baru diketahui SETELAH kredensial terverifikasi, sementara
 * `redirectTo` harus dipilih sebelum itu. Sebelumnya tujuannya dipatok
 * "/petugas" untuk semua orang, jadi setiap admin dipantul dua kali: sekali ke
 * area yang bukan haknya, sekali lagi kembali oleh middleware.
 *
 * Diuji di sini dan bukan lewat permintaan HTTP karena Server Action tidak bisa
 * dipanggil dengan curl secara wajar — payload-nya bentuk internal Next yang
 * berubah antar versi. Tes ini justru lebih tajam: ia menyatakan tujuannya per
 * peran, dan akan merah kalau seseorang memasang tujuan tetap lagi.
 */
import { login, logout } from "@/app/actions/auth"
import { signIn, signOut } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"

/**
 * next-auth adalah paket ESM yang tidak bisa di-parse jest. Yang dibutuhkan
 * berkas ini hanya kelas AuthError untuk pemeriksaan `instanceof`, jadi paket
 * aslinya diganti tiruan seminimal itu.
 *
 * Kelasnya didefinisikan DI DALAM factory karena `jest.mock` di-hoist ke atas
 * berkas — kelas yang dideklarasikan di luar belum terinisialisasi saat factory
 * dijalankan. Instansnya diambil kembali lewat requireMock supaya action dan
 * tes memakai kelas yang SAMA, sehingga `instanceof`-nya tetap sahih.
 */
jest.mock("next-auth", () => ({
  AuthError: class AuthError extends Error {},
}))

const { AuthError } = jest.requireMock("next-auth") as {
  AuthError: new (pesan: string) => Error
}

jest.mock("@/auth", () => ({ signIn: jest.fn(), signOut: jest.fn() }))
jest.mock("@/lib/prisma", () => ({
  prisma: { user: { findUnique: jest.fn() } },
}))
jest.mock("next/navigation", () => ({
  // redirect() sungguhan melempar NEXT_REDIRECT; di sini cukup mencatat tujuan.
  redirect: jest.fn(),
}))

const mSignIn = signIn as jest.Mock
const mSignOut = signOut as jest.Mock
const mRedirect = redirect as unknown as jest.Mock
const mUser = prisma.user as unknown as { findUnique: jest.Mock }

const form = (email = "a@b.c", password = "rahasia") => {
  const f = new FormData()
  f.set("email", email)
  f.set("password", password)
  return f
}

beforeEach(() => {
  jest.clearAllMocks()
  mSignIn.mockResolvedValue(undefined)
  mUser.findUnique.mockResolvedValue({ role: "PETUGAS" })
})

describe("login — tujuan per peran", () => {
  it("ADMIN langsung ke /admin, tanpa mampir ke area petugas", async () => {
    mUser.findUnique.mockResolvedValue({ role: "ADMIN" })
    await login(form("admin@peser.local"))
    expect(mRedirect).toHaveBeenCalledWith("/admin")
  })

  it("PETUGAS langsung ke /petugas, tanpa titik singgah", async () => {
    mUser.findUnique.mockResolvedValue({ role: "PETUGAS" })
    await login(form("petugas@peser.local"))
    expect(mRedirect).toHaveBeenCalledWith("/petugas")
  })

  it("hanya SATU redirect — tidak ada pantulan kedua", async () => {
    mUser.findUnique.mockResolvedValue({ role: "ADMIN" })
    await login(form())
    expect(mRedirect).toHaveBeenCalledTimes(1)
  })

  it("signIn dipanggil dengan redirect:false supaya tujuannya kita yang tentukan", async () => {
    await login(form("x@y.z", "sandi"))
    expect(mSignIn).toHaveBeenCalledWith("credentials", {
      email: "x@y.z",
      password: "sandi",
      redirect: false,
    })
  })

  it("email di-trim sebelum dipakai", async () => {
    await login(form("  spasi@peser.local  ", "s"))
    expect(mSignIn.mock.calls[0][1].email).toBe("spasi@peser.local")
  })
})

describe("login — kegagalan", () => {
  it("kredensial salah kembali ke /login dengan pesan, bukan melempar", async () => {
    mSignIn.mockRejectedValue(new AuthError("CredentialsSignin"))
    await login(form())
    expect(mRedirect).toHaveBeenCalledWith(
      "/login?error=Email%20atau%20password%20salah",
    )
    // Tidak boleh menyentuh database kalau kredensialnya sudah gagal.
    expect(mUser.findUnique).not.toHaveBeenCalled()
  })

  it("error non-Auth dilempar apa adanya, tidak disamarkan jadi 'password salah'", async () => {
    // Database mati bukan kesalahan pengguna; menyamarkannya membuat masalah
    // nyata tersembunyi di balik pesan yang keliru.
    const boom = new Error("database mati")
    mSignIn.mockRejectedValue(boom)
    await expect(login(form())).rejects.toThrow("database mati")
  })

  it("baris user hilang setelah login sah tetap mengarah ke hak paling sempit", async () => {
    // Jaring pengaman: kalaupun meleset, jangan mendarat di panel admin.
    mUser.findUnique.mockResolvedValue(null)
    await login(form())
    expect(mRedirect).toHaveBeenCalledWith("/petugas")
  })

  it("mencari user yang belum di-soft-delete", async () => {
    await login(form("ada@peser.local"))
    expect(mUser.findUnique).toHaveBeenCalledWith({
      where: { email: "ada@peser.local", deletedAt: null },
      select: { role: true },
    })
  })
})

describe("logout", () => {
  it("selalu kembali ke halaman masuk", async () => {
    await logout()
    expect(mSignOut).toHaveBeenCalledWith({ redirectTo: "/login" })
  })
})
