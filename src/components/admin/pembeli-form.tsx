"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Field, SelectField, type SelectOption } from "@/components/admin/form-fields";
import { AksiForm } from "@/components/ui/aksi-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api, apiError } from "@/lib/api";
import type { Pembeli } from "@/lib/pembeli-data";

export const PEMBELI_STATUS_OPTIONS: SelectOption[] = [
  { value: "aktif", label: "Aktif" },
  { value: "non-aktif", label: "Non-aktif" },
];

export function PembeliForm({
  initialData,
  statusOptions = PEMBELI_STATUS_OPTIONS,
  submitLabel = "Simpan",
  cancelLabel = "Batal",
  cancelHref,
  mode = "create",
  id,
  onSubmit,
  onSaved,
  onCancel,
  bare = false,
}: {
  initialData?: Partial<Pembeli>;
  statusOptions?: SelectOption[];
  submitLabel?: string;
  cancelLabel?: string;
  cancelHref?: string;
  mode?: "create" | "edit";
  id?: string;
  onSubmit?: (values: Pembeli) => void;
  onSaved?: () => void;
  onCancel?: () => void;
  bare?: boolean;
}) {
  const router = useRouter();

  const [nama, setNama] = useState(initialData?.nama ?? "");
  const [perusahaan, setPerusahaan] = useState(initialData?.perusahaan ?? "");
  const [noHp, setNoHp] = useState(initialData?.noHp ?? "");
  const [alamat, setAlamat] = useState(initialData?.alamat ?? "");
  const [catatan, setCatatan] = useState(initialData?.catatan ?? "");
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const values: Pembeli = {
      id: initialData?.id ?? "",
      nama: nama.trim(),
      perusahaan: perusahaan.trim() || null,
      noHp: noHp.trim(),
      alamat: alamat.trim(),
      catatan: catatan.trim() || null,
      isActive,
    };
    if (!values.nama || !values.noHp || !values.alamat) {
      setError("Nama, nomor HP, dan alamat wajib diisi");
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
        await api.put(`/pembeli/${id}`, values);
      } else {
        await api.post("/pembeli", values);
      }
      router.refresh();
      if (cancelHref) router.push(cancelHref);
      onSaved?.();
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
      {/* Identitas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Nama Lengkap" required htmlFor="nama">
          <Input
            id="nama"
            type="text"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            placeholder="Masukkan nama lengkap pembeli"
            required
          />
        </Field>
        <Field label="Perusahaan" htmlFor="perusahaan">
          <Input
            id="perusahaan"
            type="text"
            value={perusahaan}
            onChange={(e) => setPerusahaan(e.target.value)}
            placeholder="Masukkan nama perusahaan (opsional)"
          />
        </Field>
        <Field label="Nomor HP" required htmlFor="phone">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant font-body-md pointer-events-none">
              +62
            </span>
            <Input
              id="phone"
              type="tel"
              value={noHp}
              onChange={(e) => setNoHp(e.target.value)}
              placeholder="8123456789"
              required
              className="pl-12"
            />
          </div>
        </Field>
        <SelectField
          id="status"
          label="Status"
          required
          value={isActive ? "aktif" : "non-aktif"}
          onChange={(v) => setIsActive(v === "aktif")}
          options={statusOptions}
        />
      </div>

      {/* Additional Details */}
      <Field label="Alamat Lengkap" required htmlFor="alamat">
        <Textarea
          id="alamat"
          rows={3}
          value={alamat}
          onChange={(e) => setAlamat(e.target.value)}
          placeholder="Masukkan alamat lengkap perusahaan / pembeli..."
          required
        />
      </Field>
      <Field label="Catatan" htmlFor="catatan">
        <Textarea
          id="catatan"
          rows={3}
          value={catatan}
          onChange={(e) => setCatatan(e.target.value)}
          placeholder="Catatan tambahan tentang pembeli (opsional)..."
        />
      </Field>

      {error && (
        <p className="rounded-md bg-error-container px-3 py-2 font-label-md text-label-md text-error">
          {error}
        </p>
      )}

      {/* Action Buttons */}
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
