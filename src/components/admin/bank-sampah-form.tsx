"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

import { Field, SelectField, type SelectOption } from "@/components/admin/form-fields";
import { AksiForm } from "@/components/ui/aksi-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api, apiError } from "@/lib/api";
import type { BankSampahPayload } from "@/lib/bank-sampah-data";

const LocationPicker = dynamic(
  () => import("@/components/admin/location-picker").then((m) => m.LocationPicker),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-80 rounded-lg border border-outline-variant bg-surface-container-low flex items-center justify-center font-label-md text-label-md text-on-surface-variant">
        Memuat peta...
      </div>
    ),
  },
);

export const BANK_SAMPAH_STATUS_OPTIONS: SelectOption[] = [
  { value: "Active", label: "Active" },
  { value: "Non-aktif", label: "Non-aktif" },
];

export function BankSampahForm({
  initialData,
  kelurahanOptions = [],
  statusOptions = BANK_SAMPAH_STATUS_OPTIONS,
  submitLabel = "Simpan",
  cancelLabel = "Batal",
  cancelHref,
  mode = "create",
  id,
  onSubmit,
  onCancel,
  bare = false,
}: {
  initialData?: Partial<BankSampahPayload>;
  kelurahanOptions?: SelectOption[];
  statusOptions?: SelectOption[];
  submitLabel?: string;
  cancelLabel?: string;
  cancelHref?: string;
  mode?: "create" | "edit";
  id?: string;
  onSubmit?: (values: BankSampahPayload) => void;
  onCancel?: () => void;
  bare?: boolean;
}) {
  const router = useRouter();

  const [nama, setNama] = useState(initialData?.nama ?? "");
  const [kelurahanId, setKelurahanId] = useState(initialData?.kelurahanId ?? "");
  const [alamat, setAlamat] = useState(initialData?.alamat ?? "");
  const [latitude, setLatitude] = useState(
    initialData?.latitude != null ? String(initialData.latitude) : "",
  );
  const [longitude, setLongitude] = useState(
    initialData?.longitude != null ? String(initialData.longitude) : "",
  );
  const [isActive, setIsActive] = useState(
    initialData?.isActive ?? statusOptions[0]?.value === "Active",
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const values: BankSampahPayload = {
      nama: nama.trim(),
      kelurahanId,
      alamat: alamat.trim(),
      latitude: Number(latitude),
      longitude: Number(longitude),
      isActive,
    };
    if (!values.nama || !values.kelurahanId || !values.alamat) {
      setError("Nama, kelurahan, dan alamat wajib diisi");
      return;
    }
    if (Number.isNaN(values.latitude) || Number.isNaN(values.longitude)) {
      setError("Latitude dan longitude harus berupa angka");
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
        await api.put(`/bank-sampah/${id}`, values);
      } else {
        await api.post("/bank-sampah", values);
      }
      router.push(cancelHref ?? "/admin/bank-sampah");
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
        <Field label="Nama Bank Sampah" required htmlFor="nama">
          <Input
            id="nama"
            type="text"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            placeholder="Masukkan nama bank sampah"
            required
          />
        </Field>
        <SelectField
          id="kelurahanId"
          label="Kelurahan"
          required
          value={kelurahanId}
          onChange={setKelurahanId}
          options={kelurahanOptions}
          placeholder={kelurahanId === "" ? "Pilih Kelurahan" : undefined}
        />
        <Field label="Latitude" required htmlFor="latitude">
          <Input
            id="latitude"
            type="number"
            min={-90}
            max={90}
            step="0.0001"
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            placeholder="mis. -6.1894"
            required
          />
        </Field>
        <Field label="Longitude" required htmlFor="longitude">
          <Input
            id="longitude"
            type="number"
            min={-180}
            max={180}
            step="0.0001"
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            placeholder="mis. 106.8324"
            required
          />
        </Field>
      </div>

      <LocationPicker
        latitude={latitude ? Number(latitude) : undefined}
        longitude={longitude ? Number(longitude) : undefined}
        onChange={(lat, lng) => {
          setLatitude(String(lat));
          setLongitude(String(lng));
        }}
      />

      <Field label="Alamat Lengkap" htmlFor="alamat">
        <Textarea
          id="alamat"
          rows={3}
          value={alamat}
          onChange={(e) => setAlamat(e.target.value)}
          placeholder="Masukkan alamat lengkap bank sampah..."
        />
      </Field>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SelectField
          id="status"
          label="Status"
          required
          value={isActive ? "Active" : "Non-aktif"}
          onChange={(v) => setIsActive(v === "Active")}
          options={statusOptions}
        />
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
