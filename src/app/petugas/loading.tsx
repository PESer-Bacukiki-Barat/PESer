import { AreaMemuat, Skeleton } from "@/components/ui/skeleton"

/**
 * Skeleton area petugas — mobile-first, mengikuti `max-w-md` layout-nya.
 *
 * Di sinilah umpan balik memuat paling berarti: petugas membuka halaman dari
 * HP di lapangan, dan layar yang diam beberapa detik terbaca sebagai aplikasi
 * yang macet.
 */
export default function LoadingPetugas() {
  return (
    <AreaMemuat label="Memuat halaman">
      <div className="mb-4 space-y-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-56" />
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3">
        {Array.from({ length: 2 }, (_, i) => (
          <div
            key={i}
            className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4"
          >
            <Skeleton className="mb-2 h-3 w-16" />
            <Skeleton className="h-6 w-24" />
          </div>
        ))}
      </div>

      <div className="space-y-2">
        {Array.from({ length: 5 }, (_, i) => (
          <div
            key={i}
            className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-2/5" />
                <Skeleton className="h-3 w-3/5" />
              </div>
              <Skeleton className="h-5 w-20 shrink-0" />
            </div>
          </div>
        ))}
      </div>
    </AreaMemuat>
  )
}
