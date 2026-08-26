"use client"

import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"

export function PasswordField() {
  const [show, setShow] = useState(false)

  return (
    <div className="relative">
      <label className="mb-1 block text-sm text-zinc-600 dark:text-zinc-400" htmlFor="password">
        Password
      </label>
      <div className="relative mb-6">
        <input
          id="password"
          name="password"
          type={show ? "text" : "password"}
          required
          autoComplete="current-password"
          className="w-full rounded-md border border-black/[.08] px-3 py-2 pr-10 text-zinc-900 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-white/[.145] dark:bg-zinc-800 dark:text-zinc-50"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Sembunyikan password" : "Tampilkan password"}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
        >
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  )
}
