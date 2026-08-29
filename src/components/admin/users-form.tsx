"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import {
  Field,
  SelectField,
  type SelectOption,
} from "@/components/admin/form-fields";
import { AksiForm } from "@/components/ui/aksi-form";
import { Input } from "@/components/ui/input";
import { api, apiError, apiFieldErrors } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { MIN_DIGIT_NOHP, normalkanNoHp } from "@/lib/no-hp";
import { ROLE_OPTIONS, type Role, type UserPayload, type UserRow } from "@/lib/users-data";

export function UsersForm({
  initialData,
  mode = "create",
  id,
  options = [],
  submitLabel = "Simpan",
  cancelLabel = "Batal",
  cancelHref,
  onSubmit,
  onCancel,
  bare = false,
}: {
  initialData?: Partial<UserRow>;
  mode?: "create" | "edit";
  id?: string;
  options?: SelectOption[];
  submitLabel?: string;
  cancelLabel?: string;
  cancelHref?: string;
  onSubmit?: (values: UserPayload) => void;
  onCancel?: () => void;
  bare?: boolean;
}) {
  const router = useRouter();
  const toast = useToast();

  const [nama, setNama] = useState(initialData?.nama ?? "");
  const [email, setEmail] = useState(initialData?.email ?? "");
  const [password, setPassword] = useState("");
  const [noHp, setNoHp] = useState(initialData?.noHp ?? "");
  const [role, setRole] = useState<Role>(initialData?.role ?? "PETUGAS");
  const [bankSampahId, setBankSampahId] = useState(initialData?.bankSampahId ?? "");
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [bankSampahOptions, setBankSampahOptions] = useState<SelectOption[]>(
    options,
  );

  function clearErrors() {
    setFieldErrors({});
    setFormError(null);
  }

  useEffect(() => {
    if (options.length > 0) return;
    let active = true;
    api
      .get("/bank-sampah")
      .then((res) =>
        active &&
        setBankSampahOptions(
          (res.data ?? []).map((b: { id: string; nama: string }) => ({
            value: b.id,
            label: b.nama,
          })),
        ),
      )
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [options]);

  function buildPayload(): UserPayload {
    const payload: UserPayload = {
      email: email.trim(),
      nama: nama.trim(),
      // Kosong dikirim sebagai null, bukan "" — schema /api/users memperlakukan
      // keduanya sama, tapi null yang eksplisit membuat maksudnya terbaca.
      noHp: noHp.trim() || null,
      role,
      bankSampahId: role === "PETUGAS" ? bankSampahId || null : null,
      isActive,
    };
    if (mode === "create") payload.password = password;
    else if (password) payload.password = password;
    return payload;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!nama.trim()) errors.nama = "Nama wajib diisi";
    if (!email.trim()) errors.email = "Email wajib diisi";
    if (mode === "create" && password.length < 6)
      errors.password = "Password minimal 6 karakter";
    if (noHp.trim() && normalkanNoHp(noHp) === null)
      errors.noHp = `Nomor HP minimal ${MIN_DIGIT_NOHP} angka`;
    if (role === "PETUGAS" && !bankSampahId)
      errors.bankSampahId = "Bank sampah wajib dipilih untuk PETUGAS (BR-02)";
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    const payload = buildPayload();
    setSaving(true);
    clearErrors();
    try {
      if (mode === "edit" && id) {
        await api.put(`/users/${id}`, payload);
      } else {
        await api.post("/users", payload);
      }
      toast.sukses(mode === "edit" ? "Akun diperbarui" : "Akun ditambahkan");
      if (onSubmit) onSubmit(payload);
      else if (cancelHref) router.push(cancelHref);
    } catch (err) {
      const fe = apiFieldErrors(err);
      if (fe) {
        setFieldErrors(fe);
        setFormError(fe._form ?? null);
        // Kesalahan per-kolom sudah tampil di sebelah kolomnya; toast di sini
        // hanya mengarahkan mata kembali ke atas form kalau layarnya sudah
        // tergulir jauh.
        toast.gagal("Periksa kembali isian", fe._form ?? undefined);
      } else {
        setFormError(apiError(err));
        toast.gagal("Gagal menyimpan", apiError(err));
      }
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    if (cancelHref) router.push(cancelHref);
    else onCancel?.();
  }

  const form = (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Nama Lengkap" required htmlFor="nama" error={fieldErrors.nama}>
          <Input
            id="nama"
            type="text"
            value={nama}
            onChange={(e) => {
              clearErrors();
              setNama(e.target.value);
            }}
            placeholder="Masukkan nama lengkap"
            required
            aria-invalid={!!fieldErrors.nama}
          />
        </Field>
        <Field label="Email" required htmlFor="email" error={fieldErrors.email}>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => {
              clearErrors();
              setEmail(e.target.value);
            }}
            placeholder="email@contoh.com"
            required
            aria-invalid={!!fieldErrors.email}
          />
        </Field>
        <Field
          label={mode === "edit" ? "Password (biarkan kosong jika tidak diubah)" : "Password"}
          htmlFor="password"
          error={fieldErrors.password}
        >
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => {
              clearErrors();
              setPassword(e.target.value);
            }}
            placeholder={mode === "edit" ? "Tidak diubah" : "Minimal 6 karakter"}
            required={mode === "create"}
            aria-invalid={!!fieldErrors.password}
          />
        </Field>
        <Field
          label="Nomor HP"
          htmlFor="noHp"
          error={fieldErrors.noHp}
          hint="Dipakai area warga untuk mengenali akun ini sebagai nasabah. Kosongkan untuk akun admin/petugas biasa."
        >
          <Input
            id="noHp"
            type="tel"
            inputMode="tel"
            value={noHp}
            onChange={(e) => {
              clearErrors();
              setNoHp(e.target.value);
            }}
            placeholder="0812xxxxxxx"
            aria-invalid={!!fieldErrors.noHp}
          />
        </Field>
        <SelectField
          id="role"
          label="Role"
          required
          value={role}
          onChange={(v) => {
            clearErrors();
            setRole(v as Role);
          }}
          options={ROLE_OPTIONS}
        />
        <SelectField
          id="bankSampahId"
          label="Bank Sampah"
          required={role === "PETUGAS"}
          value={bankSampahId}
          onChange={(v) => {
            clearErrors();
            setBankSampahId(v);
          }}
          options={bankSampahOptions}
          placeholder={role === "PETUGAS" ? "Pilih Bank Sampah" : "—"}
          error={fieldErrors.bankSampahId}
        />
        <SelectField
          id="isActive"
          label="Status"
          required
          value={String(isActive)}
          onChange={(v) => {
            clearErrors();
            setIsActive(v === "true");
          }}
          options={[
            { value: "true", label: "Aktif" },
            { value: "false", label: "Non-Aktif" },
          ]}
        />
      </div>

      {formError && (
        <p className="rounded-md bg-error-container px-3 py-2 font-label-md text-label-md text-error">
          {formError}
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
