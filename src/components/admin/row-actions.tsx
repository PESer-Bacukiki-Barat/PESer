import { Eye, Pencil, Trash2, type LucideIcon } from "lucide-react";

import type { DataTableAction } from "@/components/ui/data-table";
import type { RowActionIntent } from "@/components/ui/row-action-button";

function makeAction<T>(
  intent: RowActionIntent,
  label: string,
  icon: LucideIcon,
  onClick: (row: T) => void,
): DataTableAction<T> {
  return { label, icon, intent, onClick };
}

export function viewAction<T>(onClick: (row: T) => void): DataTableAction<T> {
  return makeAction("view", "Lihat Detail", Eye, onClick);
}

export function editAction<T>(onClick: (row: T) => void): DataTableAction<T> {
  return makeAction("edit", "Edit", Pencil, onClick);
}

export function deleteAction<T>(onClick: (row: T) => void): DataTableAction<T> {
  return makeAction("delete", "Hapus", Trash2, onClick);
}
