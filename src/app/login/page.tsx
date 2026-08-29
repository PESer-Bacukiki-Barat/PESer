import type { Metadata } from "next"
import { AlertCircle, Recycle } from "lucide-react"

import { login } from "@/app/actions/auth"
import { PasswordField } from "@/components/password-field"
import { Field, inputClass } from "@/components/admin/form-fields"
import { TombolMasuk } from "./tombol-masuk"

export const metadata: Metadata = {
  title: "Masuk",
}

/**
 * Halaman masuk.
 *
 * Sebelumnya layar ini masih memakai gaya bawaan template Next.js — palet
 * zinc/emerald mentah, bukan token DESIGN.md — sehingga satu-satunya layar
 * yang dilihat SEMUA orang justru satu-satunya yang tidak ikut tema, dan tidak
 * ikut mode gelap seperti sisa aplikasi.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <span
            aria-hidden
            className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-primary-container text-on-primary-container"
          >
            <Recycle className="size-6" />
          </span>
          <h1 className="font-headline-md text-headline-md text-on-surface">PESer</h1>
          <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
            Bank Sampah Digital Kecamatan
          </p>
        </div>

        <form
          action={login}
          className="space-y-4 rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm"
        >
          {error && (
            /* role="alert" supaya pembaca layar mengumumkannya begitu halaman
               dimuat ulang dengan pesan gagal — tanpa itu, pengguna yang tidak
               melihat layar tidak tahu kenapa ia masih di sini. */
            <p
              role="alert"
              className="flex items-start gap-2 rounded-lg bg-error-container px-3 py-2.5 font-label-md text-label-md text-on-error-container"
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
      </div>
    </main>
  )
}
