"use client";

import { AlertTriangle } from "lucide-react";

import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

export function ConfirmDialog({
  open,
  onOpenChange,
  title = "Konfirmasi Hapus",
  description,
  confirmLabel = "Hapus",
  cancelLabel = "Batal",
  loading = false,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
}) {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      size="sm"
      title={title}
      description={description}
      footer={
        <>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={loading}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 flex size-10 items-center justify-center rounded-full bg-error-container">
          <AlertTriangle className="size-5 text-error" aria-hidden />
        </div>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Tindakan ini tidak dapat dibatalkan.
        </p>
      </div>
    </Modal>
  );
}
