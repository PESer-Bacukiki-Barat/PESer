"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Field, inputClass } from "@/components/admin/form-fields"
import { api, apiError, apiFieldErrors } from "@/lib/api"

export type Profil = {
  nama: string
  email: string
  role: "ADMIN" | "PETUGAS"
  bankSampah: { nama: string } | null
}

/**
 * Ubah profil & password sendiri — FR-A2.
 *
 * Dipakai bersama panel admin dan area petugas: satu-satunya bedanya adalah
 * shell tempat ia dirender, jadi tidak ada gunanya menduplikasi form ini.
 *
 * Password lama diminta lagi walaupun pengguna sudah login — itu yang mencegah
 * pengambilalihan akun dari perangkat yang tertinggal dalam keadaan login.
 */
export function ProfilForm({ profil }: { profil: Profil }) {
  const router = useRouter()

  const [nama, setNama] = useState(profil.nama)
  const [passwordLama, setPasswordLama] = useState("")
  const [passwordBaru, setPasswordBaru] = useState("")
  const [konfirmasi, setKonfirmasi] = useState("")

  const [menyimpan, setMenyimpan] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldError, setFieldError] = useState<Record<string, string>>({})
  const [sukses, setSukses] = useState<string | null>(null)

  const namaBerubah = nama.trim() !== profil.nama
  const ubahPassword = passwordBaru.length > 0 || passwordLama.length > 0
  const konfirmasiCocok = !ubahPassword || passwordBaru === konfirmasi

  const bisaSimpan =
    (namaBerubah || ubahPassword) && konfirmasiCocok && !menyimpan && nama.trim().length > 0

  async function simpan() {
    setMenyimpan(true)
    setError(null)
    setFieldError({})
    setSukses(null)

    try {
      const res = await api.patch("/profil", {
        ...(namaBerubah ? { nama: nama.trim() } : {}),
        ...(ubahPassword ? { passwordLama, passwordBaru } : {}),
      })

      setPasswordLama("")
      setPasswordBaru("")
      setKonfirmasi("")
      setSukses(
        res.headers["password-changed"] === "true"
          ? "Profil tersimpan dan password diganti. Sesi di perangkat lain masih aktif sampai kedaluwarsa — keluarkan secara manual bila perlu."
          : "Profil tersimpan.",
      )
      // Nama tampil di header/nav, jadi server component perlu dimuat ulang.
      router.refresh()
    } catch (e) {
      const fe = apiFieldErrors(e)
      if (fe) setFieldError(fe)
      setError(apiError(e))
    } finally {
      setMenyimpan(false)
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (bisaSimpan) simpan()
      }}
      className="space-y-5"
    >
      {sukses && (
        <p
          role="status"
          className="flex items-start gap-2 rounded-xl border border-secondary-fixed bg-secondary-container/50 p-4 font-label-md text-label-md text-on-secondary-container"
        >
          <CheckCircle2 className="size-4 shrink-0 mt-0.5" aria-hidden />
          {sukses}
        </p>
      )}

      {/* Identitas yang tidak bisa diubah sendiri */}
      <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4">
        <h2 className="font-headline-md text-[16px] font-semibold text-on-surface mb-3">
          Identitas
        </h2>
        <dl className="space-y-2">
          {[
            ["Email", profil.email],
            ["Peran", profil.role],
            ...(profil.bankSampah ? [["Bank Sampah", profil.bankSampah.nama]] : []),
          ].map(([k, v]) => (
            <div key={k} className="flex items-baseline justify-between gap-3">
              <dt className="font-label-sm text-label-sm text-on-surface-variant">{k}</dt>
              <dd className="font-label-md text-label-md text-on-surface text-right">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="font-label-sm text-label-sm text-on-surface-variant mt-3">
          Email, peran, dan penugasan bank sampah diubah admin kecamatan — email
          adalah identitas login Anda.
        </p>
      </section>

      {/* Nama */}
      <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4 space-y-3">
        <h2 className="font-headline-md text-[16px] font-semibold text-on-surface">
          Nama
        </h2>
        <Field label="Nama lengkap" htmlFor="nama" error={fieldError.nama} required>
          <input
            id="nama"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            autoComplete="name"
            className={inputClass(!!fieldError.nama)}
          />
        </Field>
      </section>

      {/* Password */}
      <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4 space-y-3">
        <h2 className="font-headline-md text-[16px] font-semibold text-on-surface">
          Ganti Password
        </h2>
        <p className="font-label-sm text-label-sm text-on-surface-variant">
          Kosongkan bila tidak ingin mengganti password.
        </p>

        <Field
          label="Password lama"
          htmlFor="password-lama"
          error={fieldError.passwordLama}
        >
          <input
            id="password-lama"
            type="password"
            value={passwordLama}
            onChange={(e) => setPasswordLama(e.target.value)}
            autoComplete="current-password"
            className={inputClass(!!fieldError.passwordLama)}
          />
        </Field>

        <Field
          label="Password baru"
          htmlFor="password-baru"
          error={fieldError.passwordBaru}
          hint="Minimal 6 karakter."
        >
          <input
            id="password-baru"
            type="password"
            value={passwordBaru}
            onChange={(e) => setPasswordBaru(e.target.value)}
            autoComplete="new-password"
            className={inputClass(!!fieldError.passwordBaru)}
          />
        </Field>

        <Field
          label="Ulangi password baru"
          htmlFor="konfirmasi"
          error={
            ubahPassword && !konfirmasiCocok ? "Ulangan password tidak sama" : undefined
          }
        >
          <input
            id="konfirmasi"
            type="password"
            value={konfirmasi}
            onChange={(e) => setKonfirmasi(e.target.value)}
            autoComplete="new-password"
            className={inputClass(ubahPassword && !konfirmasiCocok)}
          />
        </Field>
      </section>

      {fieldError._form && (
        <p role="alert" className="font-label-md text-label-md text-error">
          {fieldError._form}
        </p>
      )}
      {error && !fieldError._form && (
        <p role="alert" className="font-label-md text-label-md text-error">
          {error}
        </p>
      )}

      <Button type="submit" className="w-full h-12" disabled={!bisaSimpan}>
        {menyimpan ? "Menyimpan..." : "Simpan Perubahan"}
      </Button>
      {!namaBerubah && !ubahPassword && (
        <p className="text-center font-label-sm text-label-sm text-on-surface-variant">
          Ubah nama atau isi password untuk menyimpan.
        </p>
      )}
    </form>
  )
}
