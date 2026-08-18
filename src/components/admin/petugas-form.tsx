"use client";

import { useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { Camera, ChevronDown, Save } from "lucide-react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { UNIT_KERJA } from "@/components/admin/petugas-table";

export type PetugasFormValues = {
  nama: string;
  nip: string;
  noHp: string;
  email: string;
  kelurahan: string;
  status: string;
  alamat: string;
  foto?: File | string | null;
};

export type SelectOption = {
  value: string;
  label: string;
};

export const PETUGAS_STATUS_OPTIONS: SelectOption[] = [
  { value: "Aktif", label: "Aktif" },
  { value: "Non-Aktif", label: "Non-Aktif" },
];

const inputClasses =
  "w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-4 py-2.5 font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:ring-1 focus:ring-primary transition-shadow outline-none";

function Field({
  label,
  required,
  htmlFor,
  children,
}: {
  label: string;
  required?: boolean;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={htmlFor} className="block font-label-md text-label-md text-on-surface">
        {label} {required && <span className="text-error">*</span>}
      </label>
      {children}
    </div>
  );
}

function SelectField({
  id,
  label,
  required,
  value,
  onChange,
  options,
  placeholder,
}: {
  id: string;
  label: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
}) {
  return (
    <Field label={label} required={required} htmlFor={id}>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(inputClasses, "appearance-none pr-10")}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none size-4" />
      </div>
    </Field>
  );
}

export function PetugasForm({
  initialData,
  kelurahanOptions = UNIT_KERJA,
  statusOptions = PETUGAS_STATUS_OPTIONS,
  submitLabel = "Simpan",
  cancelLabel = "Batal",
  cancelHref,
  onSubmit,
  onCancel,
}: {
  initialData?: Partial<PetugasFormValues>;
  kelurahanOptions?: SelectOption[];
  statusOptions?: SelectOption[];
  submitLabel?: string;
  cancelLabel?: string;
  cancelHref?: string;
  onSubmit?: (values: PetugasFormValues) => void;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [foto, setFoto] = useState<File | string | null>(initialData?.foto ?? null);
  const [nama, setNama] = useState(initialData?.nama ?? "");
  const [nip, setNip] = useState(initialData?.nip ?? "");
  const [noHp, setNoHp] = useState(initialData?.noHp ?? "");
  const [email, setEmail] = useState(initialData?.email ?? "");
  const [kelurahan, setKelurahan] = useState(initialData?.kelurahan ?? "");
  const [status, setStatus] = useState(
    initialData?.status ?? statusOptions[0]?.value ?? "",
  );
  const [alamat, setAlamat] = useState(initialData?.alamat ?? "");

  const fotoPreview =
    typeof foto === "string" ? foto : foto instanceof File ? URL.createObjectURL(foto) : null;

  function handleFotoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setFoto(file);
    }
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    onSubmit?.({
      nama: nama.trim(),
      nip: nip.trim(),
      noHp: noHp.trim(),
      email: email.trim(),
      kelurahan,
      status,
      alamat: alamat.trim(),
      foto,
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
        {/* Photo Upload Section */}
        <div>
          <p className="block font-label-md text-label-md text-on-surface mb-2">Foto Profil</p>
          <div className="flex items-center gap-6">
            <label className="group relative w-24 h-24 shrink-0 rounded-full bg-surface-container-low border-2 border-dashed border-outline-variant flex items-center justify-center overflow-hidden cursor-pointer transition-colors hover:border-primary">
              {fotoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={fotoPreview}
                  alt="Pratinjau foto profil"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Camera className="size-8 text-on-surface-variant group-hover:text-primary transition-colors" />
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                aria-label="Unggah foto profil"
                className="sr-only"
                onChange={handleFotoChange}
              />
            </label>
            <div className="text-sm text-on-surface-variant">
              <p className="font-semibold text-on-surface mb-1">Unggah foto profil</p>
              <p>Format yang didukung: JPG, PNG. Ukuran maksimal: 2MB.</p>
            </div>
          </div>
        </div>

        <hr className="border-t border-outline-variant/50" />

        {/* Personal Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Nama Lengkap" required htmlFor="nama">
            <input
              id="nama"
              type="text"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Masukkan nama lengkap"
              required
              className={inputClasses}
            />
          </Field>
          <Field label="NIP / ID Petugas" required htmlFor="nip">
            <input
              id="nip"
              type="text"
              value={nip}
              onChange={(e) => setNip(e.target.value)}
              placeholder="Masukkan NIP atau ID"
              required
              className={inputClasses}
            />
          </Field>
          <Field label="Nomor HP" required htmlFor="phone">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant font-body-md pointer-events-none">
                +62
              </span>
              <input
                id="phone"
                type="tel"
                value={noHp}
                onChange={(e) => setNoHp(e.target.value)}
                placeholder="8123456789"
                required
                className={cn(inputClasses, "pl-12")}
              />
            </div>
          </Field>
          <Field label="Email" htmlFor="email">
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@contoh.com"
              className={inputClasses}
            />
          </Field>
        </div>

        {/* Assignment Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SelectField
            id="kelurahan"
            label="Unit Kerja / Kelurahan"
            required
            value={kelurahan}
            onChange={setKelurahan}
            options={kelurahanOptions}
            placeholder={kelurahan === "" ? "Pilih Kelurahan" : undefined}
          />
          <SelectField
            id="status"
            label="Status"
            required
            value={status}
            onChange={setStatus}
            options={statusOptions}
          />
        </div>

        {/* Additional Details */}
        <Field label="Alamat Lengkap" htmlFor="alamat">
          <textarea
            id="alamat"
            rows={3}
            value={alamat}
            onChange={(e) => setAlamat(e.target.value)}
            placeholder="Masukkan alamat lengkap tempat tinggal..."
            className={cn(inputClasses, "resize-none")}
          />
        </Field>

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