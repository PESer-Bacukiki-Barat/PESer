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
      className={cn(intentClass[intent], className)}
    />
  );
}
