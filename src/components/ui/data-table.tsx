"use client";

import { useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  RowActionButton,
  type RowActionIntent,
} from "@/components/ui/row-action-button";

export type Column<T> = {
  id: string;
  header: string;
  align?: "left" | "right" | "center";
  className?: string;
  cell: (row: T) => React.ReactNode;
};

export type DataTableAction<T> = {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
  intent?: RowActionIntent;
  onClick: (row: T) => void;
};

export type DataTableFilterOption = {
  value: string;
  label: string;
};

export type DataTableFilter<T> = {
  id: string;
  placeholder: string;
  options: DataTableFilterOption[];
  matches: (row: T, value: string) => boolean;
};

type DataTableProps<T> = {
  data: T[];
  columns: Column<T>[];
  getRowId: (row: T) => string;
  searchPlaceholder?: string;
  searchKeys?: (keyof T)[];
  filters?: DataTableFilter<T>[];
  actions?: (row: T) => DataTableAction<T>[];
  pageSize?: number;
  selectable?: boolean;
  onSelectedChange?: (ids: string[]) => void;
  toolbarActions?: React.ReactNode;
  emptyState?: React.ReactNode;
  loading?: boolean;
};

const headerClass = "p-4 font-label-md text-label-md text-on-surface-variant";
const alignClass = { left: "text-left", right: "text-right", center: "text-center" } as const;
const alignDesktopClass = {
  left: "md:text-left",
  right: "md:text-right",
  center: "md:text-center",
} as const;
const cellLabelClass = "md:hidden shrink-0 font-label-sm text-label-sm text-on-surface-variant";
const cellValueClass = "flex-1 min-w-0 text-right font-label-md text-label-md text-on-surface md:block";

const selectClass =
  "h-11 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 font-body-md text-body-md text-on-surface-variant outline-none transition-[color,box-shadow] focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/50";

export function DataTable<T>({
  data,
  columns,
  getRowId,
  searchPlaceholder = "Cari...",
  searchKeys = [],
  filters = [],
  actions,
  pageSize = 10,
  selectable = false,
  onSelectedChange,
  toolbarActions,
  emptyState,
  loading = false,
}: DataTableProps<T>) {
  const [query, setQuery] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);

  // Dipakai untuk mengembalikan pandangan ke awal tabel setiap ganti halaman.
  const wadahRef = useRef<HTMLDivElement>(null);

  const jumlahKolom = columns.length + (selectable ? 1 : 0) + (actions ? 1 : 0);

  /** Ada pencarian atau filter aktif — membedakan "kosong" dari "tersaring". */
  const sedangMenyaring =
    query.trim().length > 0 || Object.values(filterValues).some(Boolean);

  function resetSaringan() {
    setQuery("");
    setFilterValues({});
    setPage(1);
  }

  const filtered = useMemo(() => {
    let rows = data;

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      rows = rows.filter((row) =>
        searchKeys.some((key) => String(row[key]).toLowerCase().includes(q)),
      );
    }

    for (const filter of filters) {
      const value = filterValues[filter.id];
      if (value) {
        rows = rows.filter((row) => filter.matches(row, value));
      }
    }

    return rows;
  }, [data, query, filterValues, filters, searchKeys]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pageStart = (safePage - 1) * pageSize;
  const pageItems = filtered.slice(pageStart, pageStart + pageSize);

  const pageIds = pageItems.map((row) => getRowId(row));
  const allSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id));
  const someSelected = pageIds.some((id) => selected.has(id));

  function updateSelection(next: Set<string>) {
    setSelected(next);
    onSelectedChange?.(Array.from(next));
  }

  function toggleAll() {
    const next = new Set(selected);
    if (allSelected) {
      pageIds.forEach((id) => next.delete(id));
    } else {
      pageIds.forEach((id) => next.add(id));
    }
    updateSelection(next);
  }

  function toggleRow(id: string) {
    const next = new Set(selected);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    updateSelection(next);
  }

  function handlePage(nextPage: number) {
    setPage(Math.min(Math.max(1, nextPage), pageCount));

    // Tombol paginasi ada di BAWAH tabel. Tanpa ini, menekan "Berikutnya"
    // memuat baris baru sementara pandangan pengguna masih di footer — halaman
    // terasa tidak berubah sampai ia menggulir ke atas sendiri.
    wadahRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  }

  const showToolbar = searchKeys.length > 0 || filters.length > 0 || toolbarActions;

  return (
    <div className="space-y-4">
      {showToolbar && (
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {(searchKeys.length > 0 || filters.length > 0) && (
            <div className="flex flex-wrap items-center gap-3">
              {searchKeys.length > 0 && (
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant size-4" aria-hidden />
                  <Input
                    className="pl-10"
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setPage(1);
                    }}
                    placeholder={searchPlaceholder}
                  />
                </div>
              )}
              {filters.map((filter) => (
                <div key={filter.id} className="relative">
                  <select
                    value={filterValues[filter.id] ?? ""}
                    onChange={(e) => {
                      setFilterValues((prev) => ({ ...prev, [filter.id]: e.target.value }));
                      setPage(1);
                    }}
                    className={cn(selectClass, "appearance-none pr-10")}
                  >
                    <option value="">{filter.placeholder}</option>
                    {filter.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-on-surface-variant pointer-events-none size-4" aria-hidden />
                </div>
              ))}
            </div>
          )}
          {toolbarActions && (
            <div className="flex items-center gap-3 w-full lg:w-auto">{toolbarActions}</div>
          )}
        </div>
      )}

      <div
        ref={wadahRef}
        className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm scroll-mt-20"
      >
        <div className="overflow-x-auto">
          <table className="w-full block md:table text-left border-collapse">
            {/* sticky: pada daftar panjang, header yang hilang membuat pengguna
                lupa kolom mana yang sedang dibacanya. Hanya di md ke atas —
                di bawah itu tabel berubah jadi kartu bertumpuk. */}
            <thead className="hidden md:table-header-group md:sticky md:top-0 md:z-10">
              <tr className="bg-surface-container-low border-b border-outline-variant">
                {selectable && (
                  <th className={cn(headerClass, "w-12 text-center")}>
                    <Checkbox
                      checked={allSelected}
                      indeterminate={someSelected && !allSelected}
                      onCheckedChange={toggleAll}
                      aria-label="Pilih semua"
                    />
                  </th>
                )}
                {columns.map((col) => (
                  <th
                    key={col.id}
                    className={cn(
                      headerClass,
                      col.align && alignClass[col.align],
                      col.className,
                    )}
                  >
                    {col.header}
                  </th>
                ))}
                {actions && <th className={cn(headerClass, "text-right")}>Aksi</th>}
              </tr>
            </thead>
            <tbody className="block md:table-row-group md:divide-y divide-outline-variant space-y-3 md:space-y-0 p-3 md:p-0">
              {/* Saat memuat, bentuk tabelnya dipertahankan lewat baris
                  skeleton — bukan satu kalimat "Memuat..." yang membuat tinggi
                  wadah menyusut lalu melompat kembali begitu data datang. */}
              {loading &&
                Array.from({ length: 5 }, (_, i) => (
                  <tr
                    key={`memuat-${i}`}
                    className="block md:table-row border border-outline-variant md:border-0 rounded-xl md:rounded-none"
                  >
                    <td
                      colSpan={jumlahKolom}
                      className="block md:table-cell px-4 py-3.5"
                    >
                      <span className="sr-only">Memuat data…</span>
                      <span
                        aria-hidden
                        className="block h-5 animate-pulse rounded-md bg-surface-container-high"
                      />
                    </td>
                  </tr>
                ))}

              {!loading && pageItems.length === 0 && (
                <tr className="block md:table-row border border-outline-variant md:border-0 rounded-xl md:rounded-none">
                  <td
                    colSpan={jumlahKolom}
                    className="block md:table-cell p-6 md:p-8 text-center text-on-surface-variant font-label-md text-label-md"
                  >
                    {sedangMenyaring ? (
                      // Beda dengan "belum ada data": di sini datanya ADA, hanya
                      // tersembunyi oleh filter. Menyebutnya saja tidak cukup —
                      // pengguna butuh jalan keluarnya.
                      <span className="flex flex-col items-center gap-3">
                        <span>Tidak ada data yang cocok dengan pencarian atau filter.</span>
                        <Button type="button" variant="outline" size="sm" onClick={resetSaringan}>
                          Hapus filter
                        </Button>
                      </span>
                    ) : (
                      (emptyState ?? "Belum ada data.")
                    )}
                  </td>
                </tr>
              )}
              {pageItems.map((row) => {
                const id = getRowId(row);
                return (
                  <tr
                    key={id}
                    className="block md:table-row border border-outline-variant md:border-0 rounded-xl md:rounded-none overflow-hidden hover:bg-surface-container-low transition-colors"
                  >
                    {selectable && (
                      <td className="flex items-center justify-between gap-4 py-1.5 px-4 md:table-cell md:p-4 md:text-center">
                        <span className={cellLabelClass}>Pilih</span>
                        <Checkbox
                          checked={selected.has(id)}
                          onCheckedChange={() => toggleRow(id)}
                          aria-label="Pilih baris"
                        />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td
                        key={col.id}
                        className={cn(
                          "flex items-center justify-between gap-4 py-1.5 px-4 md:table-cell md:p-4",
                          col.className,
                        )}
                      >
                        <span className={cellLabelClass}>{col.header}</span>
                        <span
                          className={cn(
                            cellValueClass,
                            col.align && alignDesktopClass[col.align],
                          )}
                        >
                          {col.cell(row)}
                        </span>
                      </td>
                    ))}
                    {actions && (
                      <td className="py-1.5 px-4 md:table-cell md:p-4 md:text-right">
                        <div className="flex items-center justify-end gap-1">
                          {actions(row).map((action) => {
                            const Icon = action.icon;
                            return (
                              <RowActionButton
                                key={action.label}
                                intent={action.intent}
                                aria-label={action.label}
                                title={action.label}
                                className={action.className}
                                onClick={() => action.onClick(row)}
                              >
                                {Icon ? <Icon className="size-5" /> : action.label}
                              </RowActionButton>
                            );
                          })}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-outline-variant flex flex-col sm:flex-row items-center justify-between gap-4 bg-surface-container-lowest">
          {/* aria-live: menyaring atau mencari mengubah isi tabel tanpa
              memindahkan fokus, jadi pengguna pembaca layar tidak akan tahu
              hasilnya berubah kalau tidak diumumkan. */}
          <p
            aria-live="polite"
            className="font-label-md text-label-md text-on-surface-variant"
          >
            Menampilkan{" "}
            <span className="font-medium text-on-surface">
              {filtered.length === 0 ? 0 : pageStart + 1}
            </span>
            –
            <span className="font-medium text-on-surface">
              {Math.min(pageStart + pageSize, filtered.length)}
            </span>{" "}
            dari <span className="font-medium text-on-surface">{filtered.length}</span> data
          </p>
          {pageCount > 1 && (
            <div className="flex items-center space-x-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={safePage <= 1}
                onClick={() => handlePage(safePage - 1)}
              >
                <ChevronLeft className="size-4" aria-hidden />
                Sebelumnya
              </Button>
              <div className="flex items-center space-x-1">
                {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
                  <Button
                    key={p}
                    type="button"
                    variant={p === safePage ? "default" : "ghost"}
                    size="sm"
                    className="size-8 px-0 sentuh-nyaman"
                    aria-label={`Halaman ${p}`}
                    aria-current={p === safePage ? "page" : undefined}
                    onClick={() => handlePage(p)}
                  >
                    {p}
                  </Button>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={safePage >= pageCount}
                onClick={() => handlePage(safePage + 1)}
              >
                Berikutnya
                <ChevronRight className="size-4" aria-hidden />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
