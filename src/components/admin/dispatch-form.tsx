"use client";

import { useState, type FormEvent } from "react";
import { Save, Trash2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { Field, SelectField, inputClasses, type SelectOption } from "@/components/admin/form-fields";
import { type DispatchFormValues } from "@/lib/dispatch-data";

export function DispatchForm({
  initialData,
  bankSampahOptions,
  pembeliOptions,
  jenisSampahOptions,
  submitLabel = "Simpan",
  cancelLabel = "Batal",
  cancelHref,
  onSubmit,
  onCancel,
  bare = false,
}: {
  initialData?: Partial<DispatchFormValues>;
  bankSampahOptions: SelectOption[];
  pembeliOptions: SelectOption[];
  jenisSampahOptions: SelectOption[];
  submitLabel?: string;
  cancelLabel?: string;
  cancelHref?: string;
  onSubmit?: (values: DispatchFormValues) => void;
  onCancel?: () => void;
  bare?: boolean;
}) {
  const router = useRouter();

  const [bankSampahId, setBankSampahId] = useState(initialData?.bankSampahId ?? "");
  const [pembeliId, setPembeliId] = useState(initialData?.pembeliId ?? "");
  const [tanggalJemput, setTanggalJemput] = useState(
    initialData?.tanggalJemput ?? "",
  );
  const [alasan, setAlasan] = useState(initialData?.alasan ?? "");

  const [items, setItems] = useState<
    { jenisSampahId: string; beratTarget: string; hargaJualPerKg: string }[]
  >(
    initialData?.items?.length
      ? initialData.items
      : [{ jenisSampahId: "", beratTarget: "", hargaJualPerKg: "" }],
  );

  function handleItemChange(
    index: number,
    field: "jenisSampahId" | "beratTarget" | "hargaJualPerKg",
    value: string,
  ) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );
  }

  function addItem() {
    setItems((prev) => [
      ...prev,
      { jenisSampahId: "", beratTarget: "", hargaJualPerKg: "" },
    ]);
  }

  function removeItem(index: number) {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    onSubmit?.({
      bankSampahId: bankSampahId.trim(),
      pembeliId: pembeliId.trim(),
      tanggalJemput,
      items: items.map((item) => ({
        jenisSampahId: item.jenisSampahId.trim(),
        beratTarget: item.beratTarget.trim(),
        hargaJualPerKg: item.hargaJualPerKg.trim(),
      })),
      alasan: alasan.trim(),
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SelectField
          id="bankSampahId"
          label="Bank Sampah"
          required
          value={bankSampahId}
          onChange={setBankSampahId}
          options={bankSampahOptions}
          placeholder={bankSampahId === "" ? "Pilih Bank Sampah" : undefined}
        />
        <SelectField
          id="pembeliId"
          label="Pembeli"
          required
          value={pembeliId}
          onChange={setPembeliId}
          options={pembeliOptions}
          placeholder={pembeliId === "" ? "Pilih Pembeli" : undefined}
        />
      </div>

      <Field label="Tanggal Jemput" required htmlFor="tanggalJemput">
        <input
          id="tanggalJemput"
          type="datetime-local"
          value={tanggalJemput}
          onChange={(e) => setTanggalJemput(e.target.value)}
          required
          className={cn(inputClasses, "bg-surface-container-lowest")}
        />
      </Field>

      <Field label="Items" htmlFor="items">
        <div className="space-y-4">
          {items.map((item, index) => (
            <div
              key={index}
              className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_auto] gap-4 items-end p-4 bg-surface-container-lowest border border-outline-variant rounded-lg"
            >
              <SelectField
                id={`item-${index}-jenis`}
                label="Jenis Sampah"
                required
                value={item.jenisSampahId}
                onChange={(v) => handleItemChange(index, "jenisSampahId", v)}
                options={jenisSampahOptions}
                placeholder="Pilih Jenis Sampah"
              />
              <Field
                label="Berat Target (kg)"
                required
                htmlFor={`item-${index}-berat`}
              >
                <input
                  id={`item-${index}-berat`}
                  type="number"
                  min={0}
                  step="0.01"
                  value={item.beratTarget}
                  onChange={(e) =>
                    handleItemChange(index, "beratTarget", e.target.value)
                  }
                  placeholder="0.00"
                  required
                  className={inputClasses}
                />
              </Field>
              <Field
                label="Harga Jual (Rp/kg)"
                required
                htmlFor={`item-${index}-harga`}
              >
                <input
                  id={`item-${index}-harga`}
                  type="number"
                  min={0}
                  step="1"
                  value={item.hargaJualPerKg}
                  onChange={(e) =>
                    handleItemChange(index, "hargaJualPerKg", e.target.value)
                  }
                  placeholder="0"
                  required
                  className={inputClasses}
                />
              </Field>
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  aria-label="Hapus item"
                  className="mb-[22px] px-3 py-2 text-error hover:bg-error-container/20 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/50"
                >
                  <Trash2 className="size-4" />
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={addItem}
            className="flex items-center gap-2 text-primary hover:text-on-primary-fixed-variant font-label-md text-label-md transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/50"
          >
            <Plus className="size-4" />
            Tambah Item
          </button>
        </div>
      </Field>

      <Field label="Alasan" htmlFor="alasan">
        <textarea
          id="alasan"
          rows={3}
          value={alasan}
          onChange={(e) => setAlasan(e.target.value)}
          placeholder="Masukkan alasan (opsional)..."
          className={cn(inputClasses, "resize-none")}
        />
      </Field>

      <div className="flex items-center justify-end gap-4 pt-6 border-t border-outline-variant/50">
        <button
          type="button"
          onClick={handleCancel}
          className="px-6 py-2.5 rounded-full border border-outline text-on-surface font-label-md text-label-md hover:bg-surface-container-low transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/50"
        >
          {cancelLabel}
        </button>
        <button
          type="submit"
          className="px-6 py-2.5 rounded-full bg-primary-container text-on-primary-container font-label-md text-label-md hover:bg-primary hover:text-on-primary transition-colors flex items-center gap-2 shadow-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/50"
        >
          <Save className="size-[18px]" />
          {submitLabel}
        </button>
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
