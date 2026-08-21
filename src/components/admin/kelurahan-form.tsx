"use client";

import { useState, type FormEvent } from "react";
import { Save } from "lucide-react";
import { useRouter } from "next/navigation";

import { Field, inputClasses } from "@/components/admin/form-fields";
import { api, apiError } from "@/lib/api";
import type { KelurahanPayload } from "@/lib/kelurahan-data";

export function KelurahanForm({
  initialData,
  submitLabel = "Simpan",
  cancelLabel = "Batal",
  cancelHref,
  mode = "create",
  id,
  onSubmit,
  onCancel,
  bare = false,
}: {
  initialData?: Partial<KelurahanPayload>;
  submitLabel?: string;
  cancelLabel?: string;
  cancelHref?: string;
  mode?: "create" | "edit";
  id?: string;
  onSubmit?: (values: KelurahanPayload) => void;
  onCancel?: () => void;
  bare?: boolean;
}) {
  const router = useRouter();

  const [nama, setNama] = useState(initialData?.nama ?? "");
  const [kodeWilayah, setKodeWilayah] = useState(initialData?.kodeWilayah ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const values: KelurahanPayload = { nama: nama.trim(), kodeWilayah: kodeWilayah.trim() };
    if (!values.nama || !values.kodeWilayah) {
      setError("Nama dan kode wilayah wajib diisi");
      return;
    }

    if (onSubmit) {
      onSubmit(values);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      if (mode === "edit" && id) {
        await api.put(`/kelurahan/${id}`, values);
      } else {
        await api.post("/kelurahan", values);
      }
      router.push(cancelHref ?? "/admin/kelurahan");
    } catch (err) {
      setError(apiError(err));
    } finally {
      setSaving(false);
    }
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Nama Kelurahan" required htmlFor="nama">
          <input
            id="nama"
            type="text"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            placeholder="Masukkan nama kelurahan"
            required
            className={inputClasses}
          />
        </Field>
        <Field label="Kode Wilayah" required htmlFor="kodeWilayah">
          <input
            id="kodeWilayah"
            type="text"
            value={kodeWilayah}
            onChange={(e) => setKodeWilayah(e.target.value)}
            placeholder="cth. 32.01.01"
            required
            className={inputClasses}
          />
        </Field>
      </div>

      {error && (
        <p className="rounded-md bg-error-container px-3 py-2 font-label-md text-label-md text-error">
          {error}
        </p>
      )}

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
          disabled={saving}
          className="px-6 py-2.5 rounded-full bg-primary-container text-on-primary-container font-label-md text-label-md hover:bg-primary hover:text-on-primary transition-colors flex items-center gap-2 shadow-sm disabled:opacity-60"
        >
          <Save className="size-[18px]" />
          {saving ? "Menyimpan..." : submitLabel}
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
