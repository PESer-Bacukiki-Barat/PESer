"use client";

import { useState, type FormEvent } from "react";
import { Save } from "lucide-react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { Field, SelectField, inputClasses, type SelectOption } from "@/components/admin/form-fields";
import { NASABAH_BANK_SAMPAH_OPTIONS } from "@/lib/nasabah-data";

export type NasabahFormValues = {
  bankSampahId: string;
  nama: string;
  noHp: string;
  alamat: string;
  rt: string;
  rw: string;
  setoranId: string;
};

export function NasabahForm({
  initialData,
  bankSampahOptions = NASABAH_BANK_SAMPAH_OPTIONS,
  submitLabel = "Simpan",
  cancelLabel = "Batal",
  cancelHref,
  onSubmit,
  onCancel,
  bare = false,
}: {
  initialData?: Partial<NasabahFormValues>;
  bankSampahOptions?: SelectOption[];
  submitLabel?: string;
  cancelLabel?: string;
  cancelHref?: string;
  onSubmit?: (values: NasabahFormValues) => void;
  onCancel?: () => void;
  bare?: boolean;
}) {
  const router = useRouter();

  const [bankSampahId, setBankSampahId] = useState(initialData?.bankSampahId ?? "");
  const [nama, setNama] = useState(initialData?.nama ?? "");
  const [noHp, setNoHp] = useState(initialData?.noHp ?? "");
  const [alamat, setAlamat] = useState(initialData?.alamat ?? "");
  const [rt, setRt] = useState(initialData?.rt ?? "");
  const [rw, setRw] = useState(initialData?.rw ?? "");
  const [setoranId, setSetoranId] = useState(initialData?.setoranId ?? "");

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    onSubmit?.({
      bankSampahId,
      nama: nama.trim(),
      noHp: noHp.trim(),
      alamat: alamat.trim(),
      rt: rt.trim(),
      rw: rw.trim(),
      setoranId: setoranId.trim(),
    });
  }

  function handleCancel() {
    if (cancelHref) {
      router.push(cancelHref);
    } else {
      onCancel?.();
    }
  }

  const form = (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Identitas & Lokasi Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SelectField
          id="bankSampahId"
          label="Nama Bank Sampah"
          required
          value={bankSampahId}
          onChange={setBankSampahId}
          options={bankSampahOptions}
          placeholder={bankSampahId === "" ? "Pilih Bank Sampah" : undefined}
        />
        <Field label="Nama Lengkap" required htmlFor="nama">
          <input
            id="nama"
            type="text"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            placeholder="Masukkan nama lengkap nasabah"
            required
            className={inputClasses}
          />
        </Field>
        <Field label="Nomor HP" required htmlFor="phone">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant font-body-md pointer-events-none">
              +62
            </span>
            <input
              id="phone"
              type="tel"
              value={noHp}
              onChange={(e) => setNoHp(e.target.value)}
              placeholder="8123456789"
              required
              className={cn(inputClasses, "pl-12")}
            />
          </div>
        </Field>
        <Field label="ID Setoran" required htmlFor="setoranId">
          <input
            id="setoranId"
            type="text"
            value={setoranId}
            onChange={(e) => setSetoranId(e.target.value)}
            placeholder="mis. STN-2026-001"
            required
            className={cn(inputClasses, "font-mono")}
          />
        </Field>
        <Field label="RT" required htmlFor="rt">
          <input
            id="rt"
            type="text"
            value={rt}
            onChange={(e) => setRt(e.target.value)}
            placeholder="mis. 01"
            maxLength={3}
            required
            className={inputClasses}
          />
        </Field>
        <Field label="RW" required htmlFor="rw">
          <input
            id="rw"
            type="text"
            value={rw}
            onChange={(e) => setRw(e.target.value)}
            placeholder="mis. 05"
            maxLength={3}
            required
            className={inputClasses}
          />
        </Field>
      </div>

      {/* Alamat */}
      <Field label="Alamat Lengkap" htmlFor="alamat">
        <textarea
          id="alamat"
          rows={3}
          value={alamat}
          onChange={(e) => setAlamat(e.target.value)}
          placeholder="Masukkan alamat lengkap tempat tinggal nasabah..."
          className={cn(inputClasses, "resize-none")}
        />
      </Field>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-4 pt-6 border-t border-outline-variant/50">
        <button
          type="button"
          onClick={handleCancel}
          className="px-6 py-2.5 rounded-full border border-outline text-on-surface font-label-md text-label-md hover:bg-surface-container-low transition-colors"
        >
          {cancelLabel}
        </button>
        <button
          type="submit"
          className="px-6 py-2.5 rounded-full bg-primary-container text-on-primary-container font-label-md text-label-md hover:bg-primary hover:text-on-primary transition-colors flex items-center gap-2 shadow-sm"
        >
          <Save className="size-[18px]" />
          {submitLabel}
        </button>
      </div>
    </form>
  );

  if (bare) return form;

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 md:p-8 shadow-sm">
      {form}
    </div>
  );
}