"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Field, SelectField, type SelectOption } from "@/components/admin/form-fields";
import { AksiForm } from "@/components/ui/aksi-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api, apiError } from "@/lib/api";
import { KATEGORI, SATUAN, type JenisSampah } from "@/lib/jenis-sampah-data";

export const JENIS_SAMPAH_STATUS_OPTIONS: SelectOption[] = [
  { value: "aktif", label: "Aktif" },
  { value: "non-aktif", label: "Non-aktif" },
];

export function JenisSampahForm({
  initialData,
  kategoriOptions = KATEGORI,
  satuanOptions = SATUAN,
  statusOptions = JENIS_SAMPAH_STATUS_OPTIONS,
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
  initialData?: Partial<JenisSampah>;
  kategoriOptions?: SelectOption[];
  satuanOptions?: SelectOption[];
  statusOptions?: SelectOption[];
  submitLabel?: string;
  cancelLabel?: string;
  cancelHref?: string;
  mode?: "create" | "edit";
  id?: string;
  onSubmit?: (values: JenisSampah) => void;
  onSaved?: (values: JenisSampah) => void;
  onCancel?: () => void;
  bare?: boolean;
}) {
  const router = useRouter();

  const [kode, setKode] = useState(
    initialData?.kode != null ? String(initialData.kode) : "",
  );
  const [nama, setNama] = useState(initialData?.nama ?? "");
  const [kategori, setKategori] = useState(initialData?.kategori ?? kategoriOptions[0]?.value ?? "");
  const [satuan, setSatuan] = useState(initialData?.satuan ?? satuanOptions[0]?.value ?? "");
  const [harga, setHarga] = useState(
    initialData?.harga != null ? String(initialData.harga) : "",
  );
  const [deskripsi, setDeskripsi] = useState(initialData?.deskripsi ?? "");
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const values: JenisSampah = {
      id: initialData?.id ?? "",
      kode: Number(kode),
      nama: nama.trim(),
      kategori,
      satuan,
      harga: Number(harga) || 0,
      deskripsi: deskripsi.trim() || null,
      isActive,
    };
    if (!Number.isInteger(values.kode) || values.kode <= 0) {
      setError("Kode harus berupa angka bulat positif");
      return;
    }
    if (!values.nama) {
      setError("Nama sampah wajib diisi");
      return;
    }
    if (values.harga < 0) {
      setError("Harga tidak boleh negatif");
      return;
    }

    if (onSubmit) {
      onSubmit(values);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      let saved: JenisSampah = values;
      if (mode === "edit" && id) {
        await api.put(`/jenis-sampah/${id}`, values);
      } else {
        const res = await api.post("/jenis-sampah", values);
        saved = res.data as JenisSampah;
      }
      router.refresh();
      if (cancelHref) router.push(cancelHref);
      onSaved?.(saved);
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
      {/* Sampah Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Kode Sampah" required htmlFor="kode">
          <Input
            id="kode"
            type="number"
            min={1}
            step="1"
            value={kode}
            onChange={(e) => setKode(e.target.value)}
            placeholder="mis. 101"
            required
          />
        </Field>
        <Field label="Nama Sampah" required htmlFor="nama">
          <Input
            id="nama"
            type="text"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            placeholder="Masukkan nama sampah"
            required
          />
        </Field>
        <SelectField
          id="kategori"
          label="Kategori"
          required
          value={kategori}
          onChange={setKategori}
          options={kategoriOptions}
        />
        <SelectField
          id="satuan"
          label="Satuan"
          required
          value={satuan}
          onChange={setSatuan}
          options={satuanOptions}
        />
        <Field label="Harga (Rp / satuan)" required htmlFor="harga">
          <Input
            id="harga"
            type="number"
            min={0}
            step="0.01"
            value={harga}
            onChange={(e) => setHarga(e.target.value)}
            placeholder="mis. 2500"
            required
          />
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

      {/* Deskripsi */}
      <Field label="Deskripsi" htmlFor="deskripsi">
        <Textarea
          id="deskripsi"
          rows={3}
          value={deskripsi}
          onChange={(e) => setDeskripsi(e.target.value)}
          placeholder="Deskripsi singkat tentang jenis sampah..."
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
