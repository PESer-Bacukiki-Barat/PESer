"use client"

import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"

import { Field, inputClass } from "@/components/admin/form-fields"
import { cn } from "@/lib/utils"

/**
 * Input password dengan tombol lihat/sembunyi.
 *
 * Tombolnya duduk DI DALAM kotak input dan diberi jarak dari tepinya
 * (`right-1.5`, `inset-y-1.5`) beserta latar saat disorot, sehingga terbaca
 * sebagai bagian dari kolom isian — bukan ikon yang menempel di garis
 * pinggirnya. Lebarnya 36px dengan `sentuh-nyaman` yang memperluas daerah
 * tangkap ke 44px di perangkat sentuh, jadi jari tetap mudah mengenainya tanpa
 * membuat kotaknya terlihat besar.
 *
 * Kelasnya sempat digabung dengan `+` biasa sebagai jalan pintas: tailwind-merge
 * dulu membuang `text-body-md` di sini karena menyangkanya sekelompok dengan
 * `text-on-surface`, sehingga ukuran font kolom ini berbeda dari kolom email di
 * atasnya. Akar masalahnya sudah diperbaiki di src/lib/utils.ts, jadi jalan
 * pintasnya tinggal warisan — dan warisan yang merugikan, karena `+` melewati
 * tailwind-merge sepenuhnya: `px-4` dari inputClass dan `pr-12` di sini
 * sama-sama terpasang, dan yang menang di sisi kanan ditentukan urutan Tailwind
 * memancarkan CSS-nya, bukan oleh kode ini. Sekarang lewat `cn()`, dan tesnya
 * membuktikan ketiganya bertahan: px-4, pr-12, dan text-body-md.
 *
 * `tabIndex={-1}`: urutan tab yang wajar dari kolom password adalah langsung ke
 * tombol Masuk, bukan mampir ke pengalih visibilitas. Ia tetap bisa dijangkau
 * lewat sentuh atau mouse, dan tetap dibacakan pembaca layar.
 */
export function PasswordField({
  label = "Password",
  id = "password",
  name = "password",
  autoComplete = "current-password",
  required = true,
  error,
}: {
  label?: string
  id?: string
  name?: string
  autoComplete?: string
  required?: boolean
  error?: string
}) {
  const [terlihat, setTerlihat] = useState(false)

  return (
    <Field label={label} htmlFor={id} required={required} error={error}>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={terlihat ? "text" : "password"}
          required={required}
          autoComplete={autoComplete}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn(inputClass(!!error), "pr-12")}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setTerlihat((v) => !v)}
          aria-label={terlihat ? "Sembunyikan password" : "Tampilkan password"}
          aria-pressed={terlihat}
          className="sentuh-nyaman absolute inset-y-1.5 right-1.5 flex w-9 items-center justify-center rounded-md text-on-surface-variant transition-colors duration-fast hover:bg-surface-container-high hover:text-on-surface focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/50"
        >
          {terlihat ? (
            <EyeOff className="size-4" aria-hidden />
          ) : (
            <Eye className="size-4" aria-hidden />
          )}
        </button>
      </div>
    </Field>
  )
}
