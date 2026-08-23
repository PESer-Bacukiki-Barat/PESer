"use client";

import { useState, type FormEvent } from "react";
import { Save } from "lucide-react";
import { useRouter } from "next/navigation";

import { Field, SelectField, type SelectOption } from "@/components/admin/form-fields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { KATEGORI } from "@/lib/jenis-sampah-data";

export type JenisSampahFormValues = {
  kode: string;
  nama: string;
  kategori: string;
  berat: number;
  deskripsi: string;
  status: string;
};

export const JENIS_SAMPAH_STATUS_OPTIONS: SelectOption[] = [
  { value: "Aktif", label: "Aktif" },
  { value: "Non-aktif", label: "Non-aktif" },
];

export function JenisSampahForm({
  initialData,
  kategoriOptions = KATEGORI,
  statusOptions = JENIS_SAMPAH_STATUS_OPTIONS,
  submitLabel = "Simpan",
  cancelLabel = "Batal",
  cancelHref,
  onSubmit,
  onCancel,
  bare = false,
}: {
  initialData?: Partial<JenisSampahFormValues>;
  kategoriOptions?: SelectOption[];
  statusOptions?: SelectOption[];
  submitLabel?: string;
  cancelLabel?: string;
  cancelHref?: string;
  onSubmit?: (values: JenisSampahFormValues) => void;
  onCancel?: () => void;
  bare?: boolean;
}) {
  const router = useRouter();

  const [kode, setKode] = useState(initialData?.kode ?? "");
  const [nama, setNama] = useState(initialData?.nama ?? "");
  const [kategori, setKategori] = useState(initialData?.kategori ?? "");
  const [berat, setBerat] = useState(
    initialData?.berat != null ? String(initialData.berat) : "",
  );
  const [deskripsi, setDeskripsi] = useState(initialData?.deskripsi ?? "");
  const [status, setStatus] = useState(
    initialData?.status ?? statusOptions[0]?.value ?? "",
  );

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    onSubmit?.({
      kode: kode.trim(),
      nama: nama.trim(),
      kategori,
      berat: Number(berat) || 0,
      deskripsi: deskripsi.trim(),
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
      {/* Sampah Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Kode Sampah" required htmlFor="kode">
          <Input
            id="kode"
            type="text"
            value={kode}
            onChange={(e) => setKode(e.target.value)}
            placeholder="Masukkan kode sampah (mis. PLS-001)"
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
          placeholder={kategori === "" ? "Pilih Kategori" : undefined}
        />
        <Field label="Berat (kg)" required htmlFor="berat">
          <Input
            id="berat"
            type="number"
            min={0}
            step="0.1"
            value={berat}
            onChange={(e) => setBerat(e.target.value)}
            placeholder="0.0"
            required
          />
        </Field>
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
        <Button type="button" variant="outline" onClick={handleCancel}>
          {cancelLabel}
        </Button>
        <Button type="submit">
          <Save className="size-[18px]" />
          {submitLabel}
        </Button>
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