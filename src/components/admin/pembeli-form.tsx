"use client";

import { useState, type FormEvent } from "react";
import { Save } from "lucide-react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { Field, SelectField, inputClasses, type SelectOption } from "@/components/admin/form-fields";
import { PERUSAHAAN } from "@/lib/pembeli-data";

export type PembeliFormValues = {
  nama: string;
  perusahaan: string;
  noHp: string;
  alamat: string;
  catatan: string;
  status: string;
};

export const PEMBELI_STATUS_OPTIONS: SelectOption[] = [
  { value: "Aktif", label: "Aktif" },
  { value: "Non-aktif", label: "Non-aktif" },
];

export function PembeliForm({
  initialData,
  perusahaanOptions = PERUSAHAAN,
  statusOptions = PEMBELI_STATUS_OPTIONS,
  submitLabel = "Simpan",
  cancelLabel = "Batal",
  cancelHref,
  onSubmit,
  onCancel,
  bare = false,
}: {
  initialData?: Partial<PembeliFormValues>;
  perusahaanOptions?: SelectOption[];
  statusOptions?: SelectOption[];
  submitLabel?: string;
  cancelLabel?: string;
  cancelHref?: string;
  onSubmit?: (values: PembeliFormValues) => void;
  onCancel?: () => void;
  bare?: boolean;
}) {
  const router = useRouter();

  const [nama, setNama] = useState(initialData?.nama ?? "");
  const [perusahaan, setPerusahaan] = useState(initialData?.perusahaan ?? "");
  const [noHp, setNoHp] = useState(initialData?.noHp ?? "");
  const [alamat, setAlamat] = useState(initialData?.alamat ?? "");
  const [catatan, setCatatan] = useState(initialData?.catatan ?? "");
  const [status, setStatus] = useState(
    initialData?.status ?? statusOptions[0]?.value ?? "",
  );

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    onSubmit?.({
      nama: nama.trim(),
      perusahaan,
      noHp: noHp.trim(),
      alamat: alamat.trim(),
      catatan: catatan.trim(),
      status,
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
      {/* Perusahaan & Identitas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Nama Lengkap" required htmlFor="nama">
          <input
            id="nama"
            type="text"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            placeholder="Masukkan nama lengkap pembeli"
            required
            className={inputClasses}
          />
        </Field>
        <SelectField
          id="perusahaan"
          label="Perusahaan"
          required
          value={perusahaan}
          onChange={setPerusahaan}
          options={perusahaanOptions}
          placeholder={perusahaan === "" ? "Pilih Perusahaan" : undefined}
        />
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
        <SelectField
          id="status"
          label="Status"
          required
          value={status}
          onChange={setStatus}
          options={statusOptions}
        />
      </div>

      {/* Additional Details */}
      <Field label="Alamat Lengkap" htmlFor="alamat">
        <textarea
          id="alamat"
          rows={3}
          value={alamat}
          onChange={(e) => setAlamat(e.target.value)}
          placeholder="Masukkan alamat lengkap perusahaan / pembeli..."
          className={cn(inputClasses, "resize-none")}
        />
      </Field>
      <Field label="Catatan" htmlFor="catatan">
        <textarea
          id="catatan"
          rows={3}
          value={catatan}
          onChange={(e) => setCatatan(e.target.value)}
          placeholder="Catatan tambahan tentang pembeli (opsional)..."
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