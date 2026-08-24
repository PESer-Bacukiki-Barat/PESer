import type { ReactNode } from "react";
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

export function FieldError({ error }: { error?: string }) {
  if (!error) return null;
  return (
    <p className="font-label-sm text-label-sm text-error">{error}</p>
  );
}

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
  return (
    <div className="space-y-1">
      <label htmlFor={htmlFor} className="block font-label-md text-label-md text-on-surface">
        {label} {required && <span className="text-error">*</span>}
      </label>
      {children}
      {hint && !error && (
        <p className="font-label-sm text-label-sm text-on-surface-variant">{hint}</p>
      )}
      <FieldError error={error} />
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
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
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