"use client"

import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"

import { Field, inputClass } from "@/components/admin/form-fields"
import { cn } from "@/lib/utils"

/**
 * Input password dengan tombol lihat/sembunyi.
 *
 * Memakai `Field` dan `inputClass` yang sama dengan seluruh form aplikasi —
 * sebelumnya berkas ini menulis gayanya sendiri dengan palet Tailwind mentah
 * (zinc/emerald), sehingga layar login tidak ikut tema dan tidak ikut mode
 * gelap seperti halaman lain.
 *
 * Tombolnya `tabIndex={-1}`: urutan tab yang wajar dari kolom password adalah
 * langsung ke tombol Masuk, bukan mampir ke pengalih visibilitas. Pengguna
 * keyboard tetap bisa menjangkaunya lewat mouse atau layar sentuh, dan
 * pembaca layar tetap membacanya karena ia bukan `aria-hidden`.
 */
export function PasswordField() {
  const [terlihat, setTerlihat] = useState(false)

  return (
    <Field label="Password" htmlFor="password" required>
      <div className="relative">
        <input
          id="password"
          name="password"
          type={terlihat ? "text" : "password"}
          required
          autoComplete="current-password"
          className={cn(inputClass(false), "pr-12")}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setTerlihat((v) => !v)}
          aria-label={terlihat ? "Sembunyikan password" : "Tampilkan password"}
          aria-pressed={terlihat}
          className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-lg text-on-surface-variant transition-colors duration-fast hover:text-on-surface focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/50"
        >
          {terlihat ? (
            <EyeOff className="size-[18px]" aria-hidden />
          ) : (
            <Eye className="size-[18px]" aria-hidden />
          )}
        </button>
      </div>
    </Field>
  )
}
