"use client";

import { useState, type FormEvent } from "react";
import { Save } from "lucide-react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { Field, SelectField, inputClasses, type SelectOption } from "@/components/admin/form-fields";
import { KELURAHAN } from "@/lib/bank-sampah-data";

export type BankSampahFormValues = {
  nama: string;
  kelurahan: string;
  alamat: string;
  latitude: number;
  longitude: number;
  status: string;
};

export const BANK_SAMPAH_STATUS_OPTIONS: SelectOption[] = [
  { value: "Active", label: "Active" },
  { value: "Non-aktif", label: "Non-aktif" },
];

export function BankSampahForm({
  initialData,
  kelurahanOptions = KELURAHAN,
  statusOptions = BANK_SAMPAH_STATUS_OPTIONS,
  submitLabel = "Simpan",
  cancelLabel = "Batal",
  cancelHref,
  onSubmit,
  onCancel,
  bare = false,
}: {
  initialData?: Partial<BankSampahFormValues>;
  kelurahanOptions?: SelectOption[];
  statusOptions?: SelectOption[];
  submitLabel?: string;
  cancelLabel?: string;
  cancelHref?: string;
  onSubmit?: (values: BankSampahFormValues) => void;
  onCancel?: () => void;
  bare?: boolean;
}) {
  const router = useRouter();

  const [nama, setNama] = useState(initialData?.nama ?? "");
  const [kelurahan, setKelurahan] = useState(initialData?.kelurahan ?? "");
  const [alamat, setAlamat] = useState(initialData?.alamat ?? "");
  const [latitude, setLatitude] = useState(
    initialData?.latitude != null ? String(initialData.latitude) : "",
  );
  const [longitude, setLongitude] = useState(
    initialData?.longitude != null ? String(initialData.longitude) : "",
  );
  const [status, setStatus] = useState(
    initialData?.status ?? statusOptions[0]?.value ?? "",
  );

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    onSubmit?.({
      nama: nama.trim(),
      kelurahan,
      alamat: alamat.trim(),
      latitude: Number(latitude) || 0,
      longitude: Number(longitude) || 0,
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
      {/* Lokasi Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Nama Bank Sampah" required htmlFor="nama">
          <input
            id="nama"
            type="text"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            placeholder="Masukkan nama bank sampah"
            required
            className={inputClasses}
          />
        </Field>
        <SelectField
          id="kelurahan"
          label="Kelurahan"
          required
          value={kelurahan}
          onChange={setKelurahan}
          options={kelurahanOptions}
          placeholder={kelurahan === "" ? "Pilih Kelurahan" : undefined}
        />
        <Field label="Latitude" required htmlFor="latitude">
          <input
            id="latitude"
            type="number"
            min={-90}
            max={90}
            step="0.0001"
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            placeholder="mis. -6.1894"
            required
            className={inputClasses}
          />
        </Field>
        <Field label="Longitude" required htmlFor="longitude">
          <input
            id="longitude"
            type="number"
            min={-180}
            max={180}
            step="0.0001"
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            placeholder="mis. 106.8324"
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
          placeholder="Masukkan alamat lengkap bank sampah..."
          className={cn(inputClasses, "resize-none")}
        />
      </Field>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SelectField
          id="status"
          label="Status"
          required
          value={status}
          onChange={setStatus}
          options={statusOptions}
        />
      </div>

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