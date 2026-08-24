import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { ChevronRight } from "lucide-react"

import { prisma } from "@/lib/prisma"
import { getServerUser } from "@/lib/auth"
import { aksiTersedia, STATUS_FINAL } from "@/lib/dispatch-aksi"
import {
  DISPATCH_STATUS_LABEL,
  statusStyle,
  type DispatchStatus,
} from "@/lib/dispatch-data"

export const metadata: Metadata = {
  title: "Dispatch",
}

export const dynamic = "force-dynamic"

const fmtBerat = (n: number) =>
  new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(n)

/** Dispatch yang ditujukan ke bank sampah petugas — FR-D3..D5. */
export default async function DispatchPetugasPage() {
  const user = await getServerUser()
  if (!user?.bankSampahId) redirect("/petugas")
  const bankSampahId = user.bankSampahId

  const dispatches = await prisma.dispatch.findMany({
    // Scope dari sesi: hanya dispatch untuk bank sampah ini.
    where: { bankSampahId, deletedAt: null },
    orderBy: [{ status: "asc" }, { tanggalJemput: "asc" }],
    take: 50,
    select: {
      id: true,
      kodeDispatch: true,
      status: true,
      tanggalJemput: true,
      pembeli: { select: { nama: true } },
      items: { select: { beratTarget: true } },
    },
  })

  const pengguna = { role: user.role, bankSampahId: user.bankSampahId }

  // Yang butuh tindakan petugas = punya aksi tersedia menurut tabel §8.2.
  const perluTindakan = dispatches.filter(
    (d) => aksiTersedia(d.status, pengguna, bankSampahId).length > 0,
  )
  const lainnya = dispatches.filter(
    (d) => aksiTersedia(d.status, pengguna, bankSampahId).length === 0,
  )

  return (
    <>
      <div className="mb-4">
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
          Dispatch
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant mt-1">
          Pengiriman sampah dari bank sampah Anda ke pembeli.
        </p>
      </div>

      {dispatches.length === 0 ? (
        <p className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 font-body-md text-body-md text-on-surface-variant">
          Belum ada dispatch untuk bank sampah ini. Dispatch dibuat dan diterbitkan
          admin kecamatan.
        </p>
      ) : (
        <div className="space-y-6">
          <Bagian
            judul="Perlu Tindakan Anda"
            kosong="Tidak ada yang menunggu tindakan Anda."
            items={perluTindakan}
          />
          {lainnya.length > 0 && (
            <Bagian judul="Lainnya" kosong="" items={lainnya} />
          )}
        </div>
      )}
    </>
  )
}

type BarisDispatch = {
  id: string
  kodeDispatch: string
  status: string
  tanggalJemput: Date
  pembeli: { nama: string }
  items: { beratTarget: unknown }[]
}

function Bagian({
  judul,
  kosong,
  items,
}: {
  judul: string
  kosong: string
  items: BarisDispatch[]
}) {
  return (
    <section>
      <h2 className="font-label-md text-label-md text-on-surface-variant mb-2">{judul}</h2>
      {items.length === 0 ? (
        <p className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4 font-body-md text-body-md text-on-surface-variant">
          {kosong}
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((d) => {
            const total = d.items.reduce((a, i) => a + Number(i.beratTarget), 0)
            const status = d.status as DispatchStatus
            return (
              <li key={d.id}>
                <Link
                  href={`/petugas/dispatch/${d.id}`}
                  className="flex items-center gap-3 rounded-xl border border-outline-variant bg-surface-container-lowest p-4 transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-label-md text-label-md font-mono text-on-surface truncate">
                      {d.kodeDispatch}
                    </p>
                    <p className="font-label-sm text-label-sm text-on-surface-variant truncate">
                      {d.pembeli.nama} · {fmtBerat(total)} kg ·{" "}
                      {d.tanggalJemput.toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                  </div>
                  <span
                    className={`inline-flex shrink-0 items-center px-2.5 py-1 rounded-full font-label-sm text-label-sm ${statusStyle(status)}`}
                  >
                    {DISPATCH_STATUS_LABEL[status]}
                  </span>
                  {!STATUS_FINAL.includes(d.status as DispatchStatus) && (
                    <ChevronRight
                      className="size-4 shrink-0 text-on-surface-variant"
                      aria-hidden
                    />
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
