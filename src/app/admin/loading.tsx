import { AreaMemuat, Skeleton } from "@/components/ui/skeleton"

/**
 * Skeleton area admin.
 *
 * Bentuknya meniru susunan halaman admin — breadcrumb, judul, lalu kartu atau
 * tabel — supaya isinya datang MENGISI kerangka, bukan menggeser tata letak.
 * Sebelum ini setiap navigasi ke halaman server tidak menampilkan apa pun
 * sampai server menjawab.
 */
export default function LoadingAdmin() {
  return (
    <AreaMemuat label="Memuat halaman">
      <Skeleton className="mb-6 h-4 w-48" />

      <div className="mb-6 space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-full max-w-md" />
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4"
          >
            <Skeleton className="mb-3 h-3 w-20" />
            <Skeleton className="h-7 w-28" />
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest">
        <div className="border-b border-outline-variant bg-surface-bright px-4 py-3">
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="divide-y divide-outline-variant">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3.5">
              <Skeleton className="size-9 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/4" />
              </div>
              <Skeleton className="hidden h-4 w-24 sm:block" />
            </div>
          ))}
        </div>
      </div>
    </AreaMemuat>
  )
}
