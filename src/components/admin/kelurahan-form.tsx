"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Field } from "@/components/admin/form-fields";
import { AksiForm } from "@/components/ui/aksi-form";
import { Input } from "@/components/ui/input";
import { api, apiError } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
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
  const toast = useToast();

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
      toast.sukses(
        mode === "edit" ? "Kelurahan diperbarui" : "Kelurahan ditambahkan",
      );
      router.push(cancelHref ?? "/admin/kelurahan");
    } catch (err) {
      setError(apiError(err));
      toast.gagal("Gagal menyimpan", apiError(err));
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
          <Input
            id="nama"
            type="text"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            placeholder="Masukkan nama kelurahan"
            required
          />
        </Field>
        <Field label="Kode Wilayah" required htmlFor="kodeWilayah">
          <Input
            id="kodeWilayah"
            type="text"
            value={kodeWilayah}
            onChange={(e) => setKodeWilayah(e.target.value)}
            placeholder="cth. 32.01.01"
            required
          />
        </Field>
      </div>

      {error && (
        <p className="rounded-md bg-error-container px-3 py-2 font-label-md text-label-md text-error">
          {error}
        </p>
      )}

      <AksiForm
        onBatal={handleCancel}
        labelBatal={cancelLabel}
        labelSimpan={submitLabel}
        labelMenyimpan="Menyimpan…"
        menyimpan={saving}
      />
    </form>
  );

  if (bare) return form;

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 md:p-8 shadow-sm">
      {form}
    </div>
  );
}
