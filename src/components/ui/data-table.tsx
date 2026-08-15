"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

import { cn } from "@/lib/utils";

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
};

const headerClass = "p-4 font-label-md text-label-md text-on-surface-variant";
const cellClass = "p-4 font-label-md text-label-md text-on-surface";
const alignClass = { left: "text-left", right: "text-right", center: "text-center" } as const;

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
}: DataTableProps<T>) {
  const [query, setQuery] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);

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
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant size-4" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setPage(1);
                    }}
                    placeholder={searchPlaceholder}
                    className="w-full pl-10 pr-4 py-2 border border-outline-variant rounded-lg bg-surface-container-lowest focus:ring-2 focus:ring-primary focus:border-primary transition-shadow font-label-md text-label-md text-on-surface"
                  />
                </div>
              )}
              {filters.map((filter) => (
                <select
                  key={filter.id}
                  value={filterValues[filter.id] ?? ""}
                  onChange={(e) => {
                    setFilterValues((prev) => ({ ...prev, [filter.id]: e.target.value }));
                    setPage(1);
                  }}
                  className="border border-outline-variant rounded-lg bg-surface-container-lowest py-2 px-3 focus:ring-2 focus:ring-primary focus:border-primary transition-shadow font-label-md text-label-md text-on-surface-variant"
                >
                  <option value="">{filter.placeholder}</option>
                  {filter.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ))}
            </div>
          )}
          {toolbarActions && (
            <div className="flex items-center gap-3 w-full lg:w-auto">{toolbarActions}</div>
          )}
        </div>
      )}

      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant">
                {selectable && (
                  <th className={cn(headerClass, "w-12 text-center")}>
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = someSelected && !allSelected;
                      }}
                      onChange={toggleAll}
                      className="rounded border-outline-variant accent-primary focus:ring-primary"
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
            <tbody className="divide-y divide-outline-variant">
              {pageItems.length === 0 && (
                <tr>
                  <td
                    colSpan={columns.length + (selectable ? 1 : 0) + (actions ? 1 : 0)}
                    className="p-8 text-center text-on-surface-variant font-label-md text-label-md"
                  >
                    {emptyState ?? "Tidak ada data."}
                  </td>
                </tr>
              )}
              {pageItems.map((row) => {
                const id = getRowId(row);
                return (
                  <tr key={id} className="hover:bg-surface-container-low transition-colors group">
                    {selectable && (
                      <td className="p-4 text-center">
                        <input
                          type="checkbox"
                          checked={selected.has(id)}
                          onChange={() => toggleRow(id)}
                          className="rounded border-outline-variant accent-primary focus:ring-primary"
                          aria-label="Pilih baris"
                        />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td
                        key={col.id}
                        className={cn(
                          cellClass,
                          col.align && alignClass[col.align],
                          col.className,
                        )}
                      >
                        {col.cell(row)}
                      </td>
                    ))}
                    {actions && (
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {actions(row).map((action) => {
                            const Icon = action.icon;
                            return (
                              <button
                                key={action.label}
                                type="button"
                                title={action.label}
                                onClick={() => action.onClick(row)}
                                className={cn(
                                  "p-1.5 text-on-surface-variant hover:bg-surface-container rounded-md transition-colors",
                                  action.className,
                                )}
                              >
                                {Icon ? <Icon className="size-5" /> : action.label}
                              </button>
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
          <p className="font-label-md text-label-md text-on-surface-variant">
            Showing{" "}
            <span className="font-medium text-on-surface">
              {filtered.length === 0 ? 0 : pageStart + 1}
            </span>{" "}
            to{" "}
            <span className="font-medium text-on-surface">
              {Math.min(pageStart + pageSize, filtered.length)}
            </span>{" "}
            of <span className="font-medium text-on-surface">{filtered.length}</span> results
          </p>
          {pageCount > 1 && (
            <div className="flex items-center space-x-2">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => handlePage(safePage - 1)}
                className="flex items-center gap-1 px-3 py-1 border border-outline-variant rounded-md text-on-surface-variant hover:bg-surface-container-low transition-colors disabled:opacity-50 font-label-md text-label-md"
              >
                <ChevronLeft className="size-4" />
                Previous
              </button>
              <div className="flex items-center space-x-1">
                {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handlePage(p)}
                    className={cn(
                      "w-8 h-8 flex items-center justify-center rounded-md font-label-md text-label-md transition-colors",
                      p === safePage
                        ? "bg-primary text-on-primary"
                        : "hover:bg-surface-container-low text-on-surface",
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <button
                type="button"
                disabled={safePage >= pageCount}
                onClick={() => handlePage(safePage + 1)}
                className="flex items-center gap-1 px-3 py-1 border border-outline-variant rounded-md text-on-surface-variant hover:bg-surface-container-low transition-colors disabled:opacity-50 font-label-md text-label-md"
              >
                Next
                <ChevronRight className="size-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
