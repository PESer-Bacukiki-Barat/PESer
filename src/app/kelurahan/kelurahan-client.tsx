"use client"

import { FormEvent, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

type Kelurahan = {
  id: string
  nama: string
  kodeWilayah: string
}

export default function KelurahanClient() {
  const router = useRouter()
  const [list, setList] = useState<Kelurahan[]>([])
  const [nama, setNama] = useState("")
  const [kode, setKode] = useState("")
  const [editing, setEditing] = useState<Kelurahan | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [reload, setReload] = useState(0)

  useEffect(() => {
    let active = true
    ;(async () => {
      const res = await fetch("/api/kelurahan")
      if (res.status === 401) return router.push("/login")
      if (!res.ok) {
        if (active) setError("Gagal memuat data")
        return
      }
      if (active) {
        setError(null)
        setList(await res.json())
      }
    })()
    return () => {
      active = false
    }
  }, [reload, router])

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!editing) setError(null)
    const res = await fetch(editing ? `/api/kelurahan/${editing.id}` : "/api/kelurahan", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nama, kodeWilayah: kode }),
    })
    if (res.status === 401) return router.push("/login")
    if (!res.ok) {
      const data = await res.json().catch(() => null)
      setError(res.status === 409 ? "kodeWilayah sudah dipakai" : res.status === 400 ? "Nama dan kode wilayah wajib diisi" : typeof data?.error === "string" ? data.error : "Gagal menyimpan")
      return
    }
    setNama("")
    setKode("")
    setEditing(null)
    setError(null)
    setReload((r) => r + 1)
  }

  function edit(k: Kelurahan) {
    setEditing(k)
    setNama(k.nama)
    setKode(k.kodeWilayah)
  }

  function batal() {
    setEditing(null)
    setNama("")
    setKode("")
    setError(null)
  }

  async function hapus(k: Kelurahan) {
    if (!window.confirm(`Hapus ${k.nama}?`)) return
    const res = await fetch(`/api/kelurahan/${k.id}`, { method: "DELETE" })
    if (res.status === 401) return router.push("/login")
    if (!res.ok) setError("Gagal menghapus")
    setReload((r) => r + 1)
  }

  const inputCls =
    "w-full rounded-md border border-black/[.08] px-3 py-2 text-zinc-900 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-white/[.145] dark:bg-zinc-800 dark:text-zinc-50"

  return (
    <main className="flex flex-1 justify-center bg-zinc-50 px-4 py-8 dark:bg-black">
      <div className="w-full max-w-2xl rounded-2xl border border-black/[.08] bg-white p-8 shadow-sm dark:border-white/[.145] dark:bg-zinc-900">
        <h1 className="mb-6 text-xl font-semibold text-zinc-900 dark:text-zinc-50">Kelurahan</h1>

        {error && (
          <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </p>
        )}

        <form onSubmit={submit} className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <div>
            <label className="mb-1 block text-sm text-zinc-600 dark:text-zinc-400" htmlFor="nama">Nama</label>
            <input id="nama" value={nama} onChange={(e) => setNama(e.target.value)} required className={inputCls} />
          </div>
          <div>
            <label className="mb-1 block text-sm text-zinc-600 dark:text-zinc-400" htmlFor="kode">Kode Wilayah</label>
            <input id="kode" value={kode} onChange={(e) => setKode(e.target.value)} required className={inputCls} />
          </div>
          <div className="flex items-end gap-2">
            <Button type="submit">{editing ? "Simpan" : "Tambah"}</Button>
            {editing && (
              <Button type="button" variant="ghost" onClick={batal}>Batal</Button>
            )}
          </div>
        </form>

        <table className="w-full text-sm text-zinc-700 dark:text-zinc-300">
          <thead>
            <tr className="border-b text-left text-zinc-500">
              <th className="pb-2 font-medium">Nama</th>
              <th className="pb-2 font-medium">Kode Wilayah</th>
              <th className="pb-2 text-right font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {list.map((k) => (
              <tr key={k.id} className="border-b last:border-0">
                <td className="py-2">{k.nama}</td>
                <td className="py-2">{k.kodeWilayah}</td>
                <td className="py-2 text-right">
                  <Button size="xs" variant="ghost" onClick={() => edit(k)}>Edit</Button>
                  <Button size="xs" variant="destructive" onClick={() => hapus(k)}>Hapus</Button>
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr>
                <td colSpan={3} className="py-6 text-center text-zinc-400">Belum ada data.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  )
}
