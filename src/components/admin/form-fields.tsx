import { cloneElement, isValidElement, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

export type SelectOption = {
  value: string;
  label: string;
};

export const inputClasses =
  "w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-4 py-2.5 font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:ring-1 focus:ring-primary transition-shadow outline-none";

export function inputClass(error?: boolean) {
  return error
    ? cn(inputClasses, "border-error focus:border-error focus:ring-error")
    : inputClasses;
}

export function FieldError({ error, id }: { error?: string; id?: string }) {
  if (!error) return null;
  return (
    // role="alert" supaya pesan yang MUNCUL setelah submit diumumkan pembaca
    // layar. Tanpa itu, pengguna yang tidak melihat layar hanya tahu formnya
    // tidak jadi terkirim, tanpa tahu kenapa.
    <p id={id} role="alert" className="font-label-sm text-label-sm text-error">
      {error}
    </p>
  );
}

/**
 * Satu kolom isian beserta label, petunjuk, dan pesan errornya.
 *
 * Menyambungkan ketiganya ke input lewat `aria-describedby` dan
 * `aria-invalid` — sebelumnya pesan error dirender berdekatan secara visual
 * tapi tidak terhubung sama sekali, jadi pembaca layar membacakan input tanpa
 * pernah menyebut apa yang salah dengannya.
 *
 * Penyambungan dilakukan dengan meng-clone anaknya, bukan menuntut setiap
 * pemanggil menuliskan atribut itu sendiri: ada puluhan pemanggil, dan yang
 * dikerjakan manual di puluhan tempat pasti terlewat di sebagian.
 */
export function Field({
  label,
  required,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  htmlFor: string;
  error?: string;
  /** Penjelasan singkat di bawah input; disembunyikan saat ada error. */
  hint?: ReactNode;
  children: ReactNode;
}) {
  const idError = error ? `${htmlFor}-error` : undefined;
  const idHint = hint && !error ? `${htmlFor}-hint` : undefined;
  const describedBy = [idError, idHint].filter(Boolean).join(" ") || undefined;

  // Anak yang berupa elemen disambungkan otomatis. Atribut yang sudah ditulis
  // pemanggil tidak ditimpa — beberapa form memasang aria-invalid sendiri.
  const isian =
    isValidElement<Record<string, unknown>>(children) && describedBy
      ? cloneElement(children, {
          "aria-describedby":
            (children.props["aria-describedby"] as string | undefined) ?? describedBy,
          "aria-invalid": children.props["aria-invalid"] ?? (error ? true : undefined),
        })
      : children;

  return (
    <div className="space-y-1">
      <label htmlFor={htmlFor} className="block font-label-md text-label-md text-on-surface">
        {label}{" "}
        {required && (
          // Tanda bintang telanjang dibacakan "star" tanpa makna. Teks
          // tersembunyi memberi artinya, dan bintangnya sendiri jadi dekorasi.
          <span className="text-error">
            <span aria-hidden>*</span>
            <span className="sr-only">(wajib diisi)</span>
          </span>
        )}
      </label>
      {isian}
      {hint && !error && (
        <p id={idHint} className="font-label-sm text-label-sm text-on-surface-variant">
          {hint}
        </p>
      )}
      <FieldError error={error} id={idError} />
    </div>
  );
}

export function SelectField({
  id,
  label,
  required,
  value,
  onChange,
  options,
  placeholder,
  error,
}: {
  id: string;
  label: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
}) {
  return (
    <Field label={label} required={required} htmlFor={id} error={error}>
      {/* <select> dibungkus <div> untuk ikon panah, jadi penyambungan otomatis
          di Field tidak menjangkaunya — disambungkan manual di sini. */}
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn(inputClass(!!error), "appearance-none pr-10")}
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