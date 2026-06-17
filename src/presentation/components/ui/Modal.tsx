// Modal/Dialog — เขียนเอง: portal + overlay + focus-trap + ESC + click-outside + ล็อก scroll
"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

import { cn } from "@/src/presentation/components/ui/cn";
import { useEscapeKey } from "@/src/presentation/hooks/use-escape-key";
import { useClickOutside } from "@/src/presentation/hooks/use-click-outside";
import { useFocusTrap } from "@/src/presentation/hooks/use-focus-trap";
import { useMounted } from "@/src/presentation/hooks/use-mounted";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  /** ปิดเมื่อคลิกฉากหลัง (default true) */
  closeOnOverlayClick?: boolean;
}

export function Modal({
  open,
  onClose,
  children,
  className,
  closeOnOverlayClick = true,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const mounted = useMounted();

  useEscapeKey(onClose, open);
  useClickOutside(panelRef, () => closeOnOverlayClick && onClose(), open);
  useFocusTrap(panelRef, open);

  // ล็อก scroll ของ body ตอนเปิด
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/50" aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        className={cn(
          "relative z-10 w-full max-w-lg rounded-2xl border border-border bg-card text-card-foreground shadow-xl focus:outline-none",
          className,
        )}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}

export function ModalHeader({
  children,
  onClose,
}: {
  children: ReactNode;
  onClose?: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border p-5">
      <h2 className="text-lg font-semibold">{children}</h2>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="ปิด"
          className="text-muted transition-colors hover:text-foreground"
        >
          <X className="size-5" />
        </button>
      )}
    </div>
  );
}

export function ModalBody({ children }: { children: ReactNode }) {
  return <div className="p-5">{children}</div>;
}

export function ModalFooter({ children }: { children: ReactNode }) {
  return (
    <div className="flex justify-end gap-3 border-t border-border p-5">
      {children}
    </div>
  );
}
