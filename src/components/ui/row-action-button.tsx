"use client";

import { type ComponentProps } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type RowActionIntent = "view" | "edit" | "delete";

const intentClass: Record<RowActionIntent, string> = {
  view: "text-on-surface-variant hover:text-primary hover:bg-primary-container/20",
  edit: "text-on-surface-variant hover:text-primary hover:bg-primary-container/20",
  delete: "text-on-surface-variant hover:text-error hover:bg-error-container/20",
};

/**
 * Tombol aksi pada baris tabel.
 *
 * `sentuh-nyaman` memperluas daerah tangkapnya ke 44x44px di perangkat sentuh
 * (PRD §8.7) tanpa membesarkan tampilannya: ukuran ikon 32px pas untuk kursor,
 * tapi di bawah ambang jari — dan membesarkannya secara visual akan merusak
 * kepadatan tabel admin di desktop.
 */
export function RowActionButton({
  intent = "view",
  className,
  ...props
}: ComponentProps<typeof Button> & { intent?: RowActionIntent }) {
  return (
    <Button
      {...props}
      type="button"
      variant="ghost"
      size="icon"
      className={cn("sentuh-nyaman", intentClass[intent], className)}
    />
  );
}
