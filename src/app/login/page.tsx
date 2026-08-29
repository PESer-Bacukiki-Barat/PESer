import type { Metadata } from "next"
import { AlertCircle } from "lucide-react"

import { login } from "@/app/actions/auth"
import { PasswordField } from "@/components/password-field"
import { LogoPeser } from "@/components/brand/logo-peser"
import { Field, inputClass } from "@/components/admin/form-fields"
import { TombolMasuk } from "./tombol-masuk"

export const metadata: Metadata = {
  title: "Masuk",
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <main className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-10">
      {/**
       * Latar bergradasi tipis.
       *
       * Layar ini sebelumnya rata satu warna, dan kartu putih di atas latar
       * putih membuatnya terlihat seperti halaman yang belum selesai. Dua
       * lingkaran kabur berwarna merek memberi kedalaman tanpa mengganggu
       * keterbacaan: opasitasnya rendah, dan keduanya `aria-hidden` serta
       * `pointer-events-none` sehingga tidak pernah menghalangi interaksi.
       */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -top-24 -left-24 size-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -right-20 -bottom-28 size-80 rounded-full bg-tertiary/10 blur-3xl" />
      </div>

      <div className="w-full max-w-sm">
        <div className="mb-7 flex flex-col items-center text-center">
          <LogoPeser ukuran="lg" className="flex-col gap-3" />
          <p className="mt-2 font-body-md text-body-md text-on-surface-variant">
            Bank Sampah Digital Kecamatan
          </p>
        </div>

        <form
          action={login}
          className="space-y-4 rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm"
        >
          <div className="mb-1">
            <h1 className="font-headline-md text-[18px] font-semibold text-on-surface">
              Masuk ke akun Anda
            </h1>
            <p className="mt-0.5 font-label-sm text-label-sm text-on-surface-variant">
              Gunakan email dan password dari admin kecamatan.
            </p>
          </div>

          {error && (
            /* role="alert" supaya pembaca layar mengumumkannya begitu halaman
               dimuat ulang dengan pesan gagal — tanpa itu, pengguna yang tidak
               melihat layar tidak tahu kenapa ia masih di sini. */
            <p
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-error/30 bg-error-container px-3 py-2.5 font-label-md text-label-md text-on-error-container"
            >
              <AlertCircle className="mt-px size-[18px] shrink-0" aria-hidden />
              {error}
            </p>
          )}

          <Field label="Email" htmlFor="email" required>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              inputMode="email"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="nama@peser.local"
              className={inputClass(false)}
            />
          </Field>

          <PasswordField />

          <div className="pt-1">
            <TombolMasuk />
          </div>
        </form>

        <p className="mt-5 text-center font-label-sm text-label-sm text-on-surface-variant">
          Lupa password? Hubungi admin kecamatan.
        </p>
      </div>
    </main>
  )
}
