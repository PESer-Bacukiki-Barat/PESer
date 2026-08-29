"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Field, SelectField, type SelectOption } from "@/components/admin/form-fields";
import { AksiForm } from "@/components/ui/aksi-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api, apiError } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import type { Nasabah } from "@/lib/nasabah-data";

export const NASABAH_STATUS_OPTIONS: SelectOption[] = [
  { value: "aktif", label: "Aktif" },
  { value: "non-aktif", label: "Non-aktif" },
];

export function NasabahForm({
  initialData,
  bankSampahOptions = [],
  statusOptions = NASABAH_STATUS_OPTIONS,
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
  initialData?: Partial<Nasabah>;
  bankSampahOptions?: SelectOption[];
  statusOptions?: SelectOption[];
  submitLabel?: string;
  cancelLabel?: string;
  cancelHref?: string;
  mode?: "create" | "edit";
  id?: string;
  onSubmit?: (values: Nasabah) => void;
  onSaved?: () => void;
  onCancel?: () => void;
  bare?: boolean;
}) {
  const router = useRouter();
  const toast = useToast();

  const [kodeNasabah, setKodeNasabah] = useState(initialData?.kodeNasabah ?? "");
  const [bankSampahId, setBankSampahId] = useState(initialData?.bankSampahId ?? "");
  const [nama, setNama] = useState(initialData?.nama ?? "");
  const [noHp, setNoHp] = useState(initialData?.noHp ?? "");
  const [alamat, setAlamat] = useState(initialData?.alamat ?? "");
  const [rt, setRt] = useState(initialData?.rt ?? "");
  const [rw, setRw] = useState(initialData?.rw ?? "");
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const values: Nasabah = {
      id: initialData?.id ?? "",
      kodeNasabah: kodeNasabah.trim(),
      bankSampahId,
      nama: nama.trim(),
      noHp: noHp.trim() || null,
      alamat: alamat.trim(),
      rt: rt.trim(),
      rw: rw.trim(),
      isActive,
    };
    if (!values.kodeNasabah || !values.bankSampahId || !values.nama || !values.alamat || !values.rt || !values.rw) {
      setError("Kode nasabah, bank sampah, nama, alamat, RT, dan RW wajib diisi");
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
        await api.put(`/nasabah/${id}`, values);
      } else {
        await api.post("/nasabah", values);
      }
      router.refresh();
      if (cancelHref) router.push(cancelHref);
      onSaved?.();
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
      {/* Identitas & Lokasi Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Kode Nasabah" required htmlFor="kodeNasabah">
          <Input
            id="kodeNasabah"
            type="text"
            value={kodeNasabah}
            onChange={(e) => setKodeNasabah(e.target.value)}
            placeholder="mis. NSB-001"
            required
            className="font-mono"
          />
        </Field>
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
          <Input
            id="nama"
            type="text"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            placeholder="Masukkan nama lengkap nasabah"
            required
          />
        </Field>
        <Field label="Nomor HP" htmlFor="phone">
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
              className="pl-12"
            />
          </div>
        </Field>
        <Field label="RT" required htmlFor="rt">
          <Input
            id="rt"
            type="text"
            value={rt}
            onChange={(e) => setRt(e.target.value)}
            placeholder="mis. 01"
            maxLength={3}
            required
          />
        </Field>
        <Field label="RW" required htmlFor="rw">
          <Input
            id="rw"
            type="text"
            value={rw}
            onChange={(e) => setRw(e.target.value)}
            placeholder="mis. 05"
            maxLength={3}
            required
          />
        </Field>
      </div>

      {/* Alamat */}
      <Field label="Alamat Lengkap" required htmlFor="alamat">
        <Textarea
          id="alamat"
          rows={3}
          value={alamat}
          onChange={(e) => setAlamat(e.target.value)}
          placeholder="Masukkan alamat lengkap tempat tinggal nasabah..."
          required
        />
      </Field>

      <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
        <SelectField
          id="status"
          label="Status"
          required
          value={isActive ? "aktif" : "non-aktif"}
          onChange={(v) => setIsActive(v === "aktif")}
          options={statusOptions}
        />
      </div>

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
