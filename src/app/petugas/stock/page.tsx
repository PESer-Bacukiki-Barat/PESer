import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { prisma } from "@/lib/prisma"
import { getServerUser } from "@/lib/auth"
import { KoreksiStock } from "./koreksi-stock"

export const metadata: Metadata = {
  title: "Stock",
}

export const dynamic = "force-dynamic"

const fmtBerat = (n: number) =>
  new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(n)

/** Stock bank sampah sendiri — FR-C5. */
export default async function StockPetugasPage() {
  const user = await getServerUser()
  if (!user?.bankSampahId) redirect("/petugas")

  const [stock, koreksi] = await Promise.all([
    prisma.stock.findMany({
      where: { bankSampahId: user.bankSampahId },
      orderBy: { jenisSampah: { nama: "asc" } },
      select: {
        id: true,
        berat: true,
        beratReservasi: true,
        threshold: true,
        updatedAt: true,
        jenisSampah: { select: { nama: true } },
      },
    }),
    // FR-C8 riwayat koreksi, dibatasi ke bank sampah ini lewat relasi stock.
    prisma.koreksiStock.findMany({
      where: { stock: { bankSampahId: user.bankSampahId } },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        beratSebelum: true,
        beratSesudah: true,
        alasan: true,
        createdAt: true,
        dilakukanOleh: { select: { nama: true } },
        stock: { select: { jenisSampah: { select: { nama: true } } } },
      },
    }),
  ])

  const total = stock.reduce((a, s) => a + Number(s.berat), 0)
  const reservasi = stock.reduce((a, s) => a + Number(s.beratReservasi), 0)

  return (
    <>
      <div className="mb-4">
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
          Stock
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant mt-1">
          Stock bank sampah Anda. Berubah otomatis dari setoran dan dispatch.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4">
          <p className="font-label-sm text-label-sm text-on-surface-variant">Total</p>
          <p className="font-headline-sm text-headline-sm font-mono font-semibold text-on-surface">
            {fmtBerat(total)} kg
          </p>
        </div>
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4">
          <p className="font-label-sm text-label-sm text-on-surface-variant">Tersedia</p>
          <p className="font-headline-sm text-headline-sm font-mono font-semibold text-on-surface">
            {fmtBerat(total - reservasi)} kg
          </p>
          {reservasi > 0 && (
            <p className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">
              {fmtBerat(reservasi)} kg ditahan dispatch
            </p>
          )}
        </div>
      </div>

      {stock.length === 0 ? (
        <p className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 font-body-md text-body-md text-on-surface-variant">
          Belum ada stock. Stock terbentuk otomatis begitu setoran pertama dicatat.
        </p>
      ) : (
        <ul className="space-y-2">
          {stock.map((s) => {
            const berat = Number(s.berat)
            const ditahan = Number(s.beratReservasi)
            const tersedia = berat - ditahan
            const threshold = Number(s.threshold)
            const lewatThreshold = threshold > 0 && berat >= threshold

            return (
              <li
                key={s.id}
                className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-label-md text-label-md text-on-surface truncate">
                      {s.jenisSampah.nama}
                    </p>
                    <p className="font-label-sm text-label-sm text-on-surface-variant">
                      Tersedia {fmtBerat(tersedia)} kg
                      {ditahan > 0 && ` · ${fmtBerat(ditahan)} kg ditahan`}
                    </p>
                  </div>
                  <p className="font-headline-sm text-headline-sm font-mono text-on-surface shrink-0">
                    {fmtBerat(berat)} kg
                  </p>
                </div>
                {lewatThreshold && (
                  <p className="mt-2 font-label-sm text-label-sm text-on-tertiary-container">
                    Sudah melewati ambang {fmtBerat(threshold)} kg — siap dijemput.
                  </p>
                )}
                <div className="mt-3 flex justify-end">
                  <KoreksiStock
                    stockId={s.id}
                    jenisSampah={s.jenisSampah.nama}
                    beratSekarang={berat}
                    beratReservasi={ditahan}
                  />
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {koreksi.length > 0 && (
        <section className="mt-6">
          <h2 className="font-label-md text-label-md text-on-surface-variant mb-2">
            Riwayat Koreksi
          </h2>
          <ul className="space-y-2">
            {koreksi.map((k) => {
              const sebelum = Number(k.beratSebelum)
              const sesudah = Number(k.beratSesudah)
              const delta = sesudah - sebelum
              return (
                <li
                  key={k.id}
                  className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-label-md text-label-md text-on-surface truncate">
                        {k.stock.jenisSampah.nama}
                      </p>
                      <p className="font-label-sm text-label-sm text-on-surface-variant font-mono">
                        {fmtBerat(sebelum)} kg → {fmtBerat(sesudah)} kg
                      </p>
                    </div>
                    <p
                      className={`font-label-md text-label-md font-mono shrink-0 ${
                        delta > 0 ? "text-primary" : "text-error"
                      }`}
                    >
                      {delta > 0 ? "+" : ""}
                      {fmtBerat(delta)} kg
                    </p>
                  </div>
                  <p className="font-body-md text-body-md text-on-surface-variant mt-1">
                    {k.alasan}
                  </p>
                  <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">
                    {k.dilakukanOleh.nama} ·{" "}
                    {k.createdAt.toLocaleString("id-ID", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </li>
              )
            })}
          </ul>
        </section>
      )}
    </>
  )
}
