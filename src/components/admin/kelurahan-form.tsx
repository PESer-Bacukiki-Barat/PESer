"use client";

import { useState, type FormEvent } from "react";
import { Save } from "lucide-react";
import { useRouter } from "next/navigation";

import { Field, SelectField, inputClasses, type SelectOption } from "@/components/admin/form-fields";

export type KelurahanFormValues = {
  name: string;
  kecamatan: string;
  bankSampah: number;
  status: string;
};

export const KELURAHAN_STATUS_OPTIONS: SelectOption[] = [
  { value: "Aktif", label: "Aktif" },
  { value: "Non-aktif", label: "Non-aktif" },
];

export function KelurahanForm({
  initialData,
  statusOptions = KELURAHAN_STATUS_OPTIONS,
  submitLabel = "Simpan",
  cancelLabel = "Batal",
  cancelHref,
  onSubmit,
  onCancel,
}: {
  initialData?: Partial<KelurahanFormValues>;
  statusOptions?: SelectOption[];
  submitLabel?: string;
  cancelLabel?: string;
  cancelHref?: string;
  onSubmit?: (values: KelurahanFormValues) => void;
  onCancel?: () => void;
}) {
  const router = useRouter();

  const [name, setName] = useState(initialData?.name ?? "");
  const [kecamatan, setKecamatan] = useState(initialData?.kecamatan ?? "");
  const [bankSampah, setBankSampah] = useState(
    initialData?.bankSampah != null ? String(initialData.bankSampah) : "0",
  );
  const [status, setStatus] = useState(
    initialData?.status ?? statusOptions[0]?.value ?? "",
  );

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    onSubmit?.({
      name: name.trim(),
      kecamatan: kecamatan.trim(),
      bankSampah: Number(bankSampah) || 0,
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

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 md:p-8 shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Wilayah Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Nama Kelurahan" required htmlFor="name">
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Masukkan nama kelurahan"
              required
              className={inputClasses}
            />
          </Field>
          <Field label="Kecamatan" required htmlFor="kecamatan">
            <input
              id="kecamatan"
              type="text"
              value={kecamatan}
              onChange={(e) => setKecamatan(e.target.value)}
              placeholder="Masukkan nama kecamatan"
              required
              className={inputClasses}
            />
          </Field>
          <Field label="Jumlah Bank Sampah" htmlFor="bankSampah">
            <input
              id="bankSampah"
              type="number"
              min={0}
              value={bankSampah}
              onChange={(e) => setBankSampah(e.target.value)}
              placeholder="0"
              className={inputClasses}
            />
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
    </div>
  );
}