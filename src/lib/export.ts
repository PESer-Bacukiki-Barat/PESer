function escapeCsv(value: unknown): string {
  const str = value == null ? "" : String(value);
  if (str.includes(",") || str.includes("\n") || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

type CsvColumn = { key: string; label: string };

export function exportToCsv(
  filename: string,
  rows: Record<string, unknown>[],
  headers?: CsvColumn[],
): void {
  const cols: CsvColumn[] = headers
    ? headers
    : rows.length > 0
      ? Object.keys(rows[0]).map((k) => ({ key: k, label: k }))
      : [];
  const headerRow = cols.map((c) => escapeCsv(c.label)).join(",");
  const bodyRows = rows
    .map((row) => cols.map((c) => escapeCsv(row[c.key])).join(","))
    .join("\n");

  const csv = `${headerRow}\n${bodyRows}`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.csv`;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
