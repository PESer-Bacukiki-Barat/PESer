"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CloudOff, Plus, Recycle, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, inputClass } from "@/components/admin/form-fields";
import { api, apiError, apiFieldErrors, apiStatus } from "@/lib/api";
import { useAntrean } from "@/components/petugas/antrean-provider";
import {
  KONDISI_SAMPAH_OPTIONS,
  type KondisiSampah,
} from "@/lib/setoran-data";
import {
  DESIMAL_BERAT,
  PEMBULATAN_TUNAI,
} from "@/lib/constants";

export type NasabahOpsi = { id: string; kodeNasabah: string; nama: string };
export type JenisOpsi = { id: string; nama: string; harga: number };

type Baris = { jenisSampahId: string; berat: string; kondisi: KondisiSampah };

const barisBaru = (): Baris => ({ jenisSampahId: "", berat: "", kondisi: "BERSIH" });

const fmtRupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);

const fmtBerat = (n: number) =>
  new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(n);

/** Pembulatan tunai ke Rp 500 terdekat — PRD §4.1 "Aturan Pembulatan". */
const bulatkanTunai = (n: number) => Math.round(n / PEMBULATAN_TUNAI) * PEMBULATAN_TUNAI;

/**
 * Form setor untuk warga/nasabah — alur PRD §4.1.
 *
 * Perbedaan dengan form petugas: nasabah sudah pasti (akun sendiri), jadi
 * tidak ada pemilihan nasabah; yang tersisa adalah item sampah dan konfirmasi
 * total. Angka di layar hanya estimasi — server yang menghitung nilai final
 * dari JenisSampah.harga (BR-09), harga tidak pernah dikirim dari klien.
 *
 * Idempotency-Key dibuat sekali per pengisian dan dipakai ulang saat retry
 * (§6.1). Gagal jaringan → masuk antrean IndexedDB yang sama dengan area
 * petugas, dikirim ulang otomatis saat koneksi pulih (G4).
 */
export function SetorWargaForm({
  nasabah,
  jenis,
}: {
  nasabah: NasabahOpsi;
  jenis: JenisOpsi[];
}) {
  const router = useRouter();
  const { antrekan, online } = useAntrean();

  const [baris, setBaris] = useState<Baris[]>([barisBaru()]);
  const [mengirim, setMengirim] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<Record<string, string>>({});
  const [diantrekan, setDiantrekan] = useState(false);

  // Lihat komentar setoran petugas: ref, bukan state/useEffect.
  const idempotencyKey = useRef<string | null>(null);

  const hargaById = useMemo(
    () => new Map(jenis.map((j) => [j.id, j.harga])),
    [jenis],
  );

  const rincian = useMemo(
    () =>
      baris.map((b) => {
        const harga = hargaById.get(b.jenisSampahId) ?? 0;
        const berat = Number(b.berat) || 0;
        return { harga, berat, subtotal: berat * harga };
      }),
    [baris, hargaById],
  );

  const totalBerat = rincian.reduce((a, r) => a + r.berat, 0);
  const totalKotor = rincian.reduce((a, r) => a + r.subtotal, 0);
  // Estimasi yang dibayar ke warga dibulatkan ke Rp 500 (PRD §4.1); angka
  // final tetap milik server.
  const totalNilai = bulatkanTunai(totalKotor);

  const bisaKirim =
    baris.length > 0 && baris.every((b) => b.jenisSampahId && Number(b.berat) > 0);

  function ubahBaris(i: number, patch: Partial<Baris>) {
    setBaris((p) => p.map((b, idx) => (idx === i ? { ...b, ...patch } : b)));
  }

  function mulaiBaru() {
    idempotencyKey.current = null;
    setBaris([barisBaru()]);
    setDiantrekan(false);
    setError(null);
    setFieldError({});
  }

  async function kirim() {
    idempotencyKey.current ??= crypto.randomUUID();
    const kunci = idempotencyKey.current;
    setMengirim(true);
    setError(null);
    setFieldError({});

    const payload = {
      nasabahId: nasabah.id,
      cashDibayar: true,
      items: baris.map((b) => ({
        jenisSampahId: b.jenisSampahId,
        berat: Number(b.berat),
        kondisi: b.kondisi,
      })),
    };
    const ringkasan = {
      nasabah: nasabah.nama,
      totalBerat,
      totalNilai: totalNilai,
    };

    if (!online) {
      await antrekan(kunci, payload, ringkasan);
      setDiantrekan(true);
      setMengirim(false);
      return;
    }

    try {
      const { data } = await api.post<{ id: string }>("/setoran", payload, {
        headers: { "Idempotency-Key": kunci },
      });
      router.push(`/setoran/${data.id}`);
    } catch (e) {
      const status = apiStatus(e);
      if (status && status >= 400 && status < 500) {
        // Isi form yang salah — antre hanya menunda kegagalan yang sama.
        const fe = apiFieldErrors(e);
        if (fe) setFieldError(fe);
        setError(apiError(e));
        setMengirim(false);
        return;
      }
      await antrekan(kunci, payload, ringkasan);
      setDiantrekan(true);
      setMengirim(false);
    }
  }

  if (diantrekan) {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-xl border border-tertiary bg-tertiary-container/40 p-4">
          <CloudOff className="size-5 shrink-0 text-on-tertiary-container" aria-hidden />
          <div>
            <p className="font-headline-sm text-[16px] font-semibold text-on-tertiary-container">
              Tersimpan di antrean
            </p>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1">
              {online
                ? "Server belum bisa dihubungi. Setoran terkirim otomatis begitu koneksi stabil."
                : "Anda sedang offline. Setoran terkirim otomatis begitu koneksi pulih."}
            </p>
          </div>
        </div>

        <dl className="space-y-1 rounded-xl border border-outline-variant bg-surface-container-lowest p-4">
          <div className="flex items-baseline justify-between">
            <dt className="font-label-md text-label-md text-on-surface-variant">Total berat</dt>
            <dd className="font-mono font-label-md text-label-md text-on-surface">
              {fmtBerat(totalBerat)} kg
            </dd>
          </div>
          <div className="flex items-baseline justify-between">
            <dt className="font-label-md text-label-md text-on-surface-variant">Total nilai</dt>
            <dd className="font-mono text-[18px] font-semibold text-primary">
              {fmtRupiah(totalNilai)}
            </dd>
          </div>
        </dl>

        <Button type="button" className="h-12 w-full rounded-full" onClick={mulaiBaru}>
          Catat Setoran Berikutnya
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (bisaKirim && !mengirim) kirim();
      }}
      className="space-y-5"
    >
      {/* Item sampah */}
      <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-headline-md text-[16px] font-semibold text-on-surface">
            Item Sampah
          </h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setBaris((p) => [...p, barisBaru()])}
          >
            <Plus aria-hidden /> Tambah
          </Button>
        </div>

        {fieldError.items && (
          <p className="font-label-sm text-label-sm text-error">{fieldError.items}</p>
        )}

        <ul className="space-y-3">
          {baris.map((b, i) => (
            <li
              key={i}
              className="space-y-3 rounded-lg border border-outline-variant bg-surface-container-low p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  Item {i + 1}
                </span>
                {baris.length > 1 && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    aria-label={`Hapus item ${i + 1}`}
                    onClick={() => setBaris((p) => p.filter((_, idx) => idx !== i))}
                  >
                    <Trash2 aria-hidden />
                  </Button>
                )}
              </div>

              <Field label="Jenis sampah" htmlFor={`jenis-${i}`} required>
                <select
                  id={`jenis-${i}`}
                  value={b.jenisSampahId}
                  onChange={(e) => ubahBaris(i, { jenisSampahId: e.target.value })}
                  className={inputClass(false)}
                >
                  <option value="">— pilih jenis —</option>
                  {jenis.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.nama} — {fmtRupiah(j.harga)}/kg
                    </option>
                  ))}
                </select>
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label={`Berat (kg)`} htmlFor={`berat-${i}`} required>
                  <input
                    id={`berat-${i}`}
                    type="number"
                    min={0}
                    step="0.01"
                    inputMode="decimal"
                    value={b.berat}
                    onChange={(e) => ubahBaris(i, { berat: e.target.value })}
                    className={`${inputClass(false)} text-right`}
                  />
                </Field>
                <Field label="Kondisi" htmlFor={`kondisi-${i}`} required>
                  <select
                    id={`kondisi-${i}`}
                    value={b.kondisi}
                    onChange={(e) =>
                      ubahBaris(i, { kondisi: e.target.value as KondisiSampah })
                    }
                    className={inputClass(false)}
                  >
                    {KONDISI_SAMPAH_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <p className="text-right font-mono font-label-md text-label-md text-on-surface">
                {rincian[i].berat > 0 && rincian[i].harga > 0
                  ? `${fmtBerat(rincian[i].berat)} kg × ${fmtRupiah(rincian[i].harga)} = ${fmtRupiah(rincian[i].subtotal)}`
                  : "—"}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* Total — angka pembulatan dijelaskan supaya warga tidak kaget */}
      <Card>
        <CardContent className="space-y-2 py-1">
          <dl aria-live="polite" className="space-y-1">
            <div className="flex items-baseline justify-between">
              <dt className="font-label-md text-label-md text-on-surface-variant">
                Total berat
              </dt>
              <dd className="font-mono text-[18px] text-on-surface">
                {fmtBerat(totalBerat)} kg
              </dd>
            </div>
            <div className="flex items-baseline justify-between">
              <dt className="font-label-md text-label-md text-on-surface-variant">
                Estimasi diterima
              </dt>
              <dd className="font-mono text-[18px] font-semibold text-primary">
                {fmtRupiah(totalNilai)}
              </dd>
            </div>
          </dl>
          <p className="font-label-sm text-label-sm text-on-surface-variant">
            Dibulatkan ke Rp {PEMBULATAN_TUNAI.toLocaleString("id-ID")} terdekat.
            Tunai diserahkan petugas saat penimbangan (BR-04).
          </p>
        </CardContent>
      </Card>

      {error && (
        <p role="alert" className="font-label-md text-label-md text-error">
          {error}
        </p>
      )}

      <Button
        type="submit"
        className="h-12 w-full rounded-full gap-2 font-label-md text-label-md font-semibold"
        disabled={!bisaKirim || mengirim}
      >
        <Recycle className="size-5" aria-hidden />
        {mengirim ? "Menyimpan..." : "Simpan Setoran"}
      </Button>
      {!bisaKirim && !mengirim && (
        <p className="text-center font-label-sm text-label-sm text-on-surface-variant">
          Lengkapi setiap item (jenis + berat) untuk menyimpan. Berat maksimal{" "}
          {DESIMAL_BERAT === 2 ? "2 desimal." : `${DESIMAL_BERAT} desimal.`}
        </p>
      )}
      <p className="text-center font-label-sm text-label-sm text-on-surface-variant">
        Sudah pernah setor? Lihat{" "}
        <Link href="/aktivitas" className="font-medium text-primary underline-offset-4 hover:underline">
          riwayat setoran
        </Link>
        .
      </p>
    </form>
  );
}
