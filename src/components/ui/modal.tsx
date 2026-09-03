"use client";

import { useRef, type ReactElement, type ReactNode } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

const sizeClasses = {
  sm: "md:max-w-md",
  md: "md:max-w-xl",
  lg: "md:max-w-[45rem]",
} as const;

export type ModalProps = {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: ReactElement;
  title?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  size?: keyof typeof sizeClasses;
  hideCloseButton?: boolean;
  className?: string;
};

export function Modal({
  open,
  defaultOpen,
  onOpenChange,
  trigger,
  title,
  description,
  children,
  footer,
  size = "md",
  hideCloseButton = false,
  className,
}: ModalProps) {
  const titleRef = useRef<HTMLHeadingElement | null>(null);

  return (
    <Dialog.Root
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={(nextOpen) => onOpenChange?.(nextOpen)}
      modal
    >
      {trigger && <Dialog.Trigger render={trigger} />}

      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-[2px] transition-opacity duration-normal ease-standard data-[starting-style]:opacity-0 data-[ending-style]:opacity-0" />

        <Dialog.Popup
          className={cn(
            "fixed inset-x-0 bottom-0 z-[101] w-full max-h-[90dvh] flex flex-col",
            "bg-surface-container-lowest border-t border-outline-variant md:border",
            "rounded-t-[24px] md:rounded-[24px]",
            "shadow-[0_-12px_40px_rgba(0,27,18,0.16)] md:shadow-[0_24px_60px_rgba(0,27,18,0.2)]",
            "md:inset-0 md:m-auto md:max-h-[85dvh]",
            "transition-[opacity,transform,translate,scale] duration-normal ease-[var(--ease-emphasized)]",
            "translate-y-0",
            "data-[starting-style]:translate-y-full data-[ending-style]:translate-y-full",
            "md:data-[starting-style]:translate-y-0 md:data-[ending-style]:translate-y-0",
            "md:data-[starting-style]:scale-95 md:data-[ending-style]:scale-95",
            "md:data-[starting-style]:opacity-0 md:data-[ending-style]:opacity-0",
            sizeClasses[size],
            className,
          )}
          initialFocus={title ? titleRef : undefined}
        >
          {(title || !hideCloseButton) && (
            <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4 md:px-8 md:pt-8 border-b border-outline-variant/60 shrink-0">
              <div className="min-w-0">
                {title && (
                  <Dialog.Title
                    ref={titleRef}
                    tabIndex={-1}
                    className="font-headline-md text-headline-md text-on-surface outline-none"
                  >
                    {title}
                  </Dialog.Title>
                )}
                {description && (
                  <Dialog.Description className="font-body-md text-body-md text-on-surface-variant mt-1">
                    {description}
                  </Dialog.Description>
                )}
              </div>
              {!hideCloseButton && (
                <Dialog.Close
                  aria-label="Tutup"
                  className="p-2 -mr-2 -mt-1 shrink-0 rounded-full text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface active:opacity-80 transition-colors"
                >
                  <X className="size-5" aria-hidden />
                </Dialog.Close>
              )}
            </div>
          )}

          <Dialog.Viewport className="flex-1 min-h-0 overflow-y-auto px-6 py-6 md:px-8">
            {children}
          </Dialog.Viewport>

          {footer && (
            <div className="px-6 py-4 md:px-8 border-t border-outline-variant/60 flex items-center justify-end gap-3 shrink-0">
              {footer}
            </div>
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}