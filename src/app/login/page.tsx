import { login } from "@/app/actions/auth"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <main className="flex flex-1 items-center justify-center bg-zinc-50 px-4 dark:bg-black">
      <form
        action={login}
        className="w-full max-w-sm rounded-2xl border border-black/[.08] bg-white p-8 shadow-sm dark:border-white/[.145] dark:bg-zinc-900"
      >
        <h1 className="mb-6 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Masuk — Peser
        </h1>

        {error && (
          <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </p>
        )}

        <label className="mb-1 block text-sm text-zinc-600 dark:text-zinc-400" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="mb-4 w-full rounded-md border border-black/[.08] px-3 py-2 text-zinc-900 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-white/[.145] dark:bg-zinc-800 dark:text-zinc-50"
        />

        <label className="mb-1 block text-sm text-zinc-600 dark:text-zinc-400" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="mb-6 w-full rounded-md border border-black/[.08] px-3 py-2 text-zinc-900 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-white/[.145] dark:bg-zinc-800 dark:text-zinc-50"
        />

        <button
          type="submit"
          className="h-11 w-full rounded-md bg-emerald-600 font-medium text-white transition-colors hover:bg-emerald-700"
        >
          Masuk
        </button>
      </form>
    </main>
  )
}
