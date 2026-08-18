import { redirect } from "next/navigation"
import { logout } from "@/app/actions/auth"
import { getServerUser } from "@/lib/auth"

export default async function DashboardPage() {
  const user = await getServerUser()
  if (!user) redirect("/login")

  return (
    <main className="flex flex-1 items-center justify-center bg-zinc-50 px-4 dark:bg-black">
      <div className="w-full max-w-md rounded-2xl border border-black/[.08] bg-white p-8 shadow-sm dark:border-white/[.145] dark:bg-zinc-900">
        <h1 className="mb-6 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Dashboard
        </h1>

        <dl className="space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
          <div className="flex justify-between">
            <dt className="text-zinc-500">Nama</dt>
            <dd>{user.nama}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-zinc-500">Email</dt>
            <dd>{user.email}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-zinc-500">Role</dt>
            <dd>{user.role}</dd>
          </div>
          {user.bankSampah && (
            <div className="flex justify-between">
              <dt className="text-zinc-500">Bank Sampah</dt>
              <dd>{user.bankSampah.nama}</dd>
            </div>
          )}
        </dl>

        <form action={logout} className="mt-8">
          <button
            type="submit"
            className="h-11 w-full rounded-md border border-black/[.08] font-medium text-zinc-900 transition-colors hover:bg-black/[.04] dark:border-white/[.145] dark:text-zinc-50 dark:hover:bg-[#1a1a1a]"
          >
            Keluar
          </button>
        </form>
      </div>
    </main>
  )
}
