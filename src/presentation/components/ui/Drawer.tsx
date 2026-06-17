// Drawer — panel เลื่อนจากขอบ ซ้าย/ขวา; กลไกเดียวกับ Modal
"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

import { cn } from "@/src/presentation/components/ui/cn";
import { useEscapeKey } from "@/src/presentation/hooks/use-escape-key";
import { useClickOutside } from "@/src/presentation/hooks/use-click-outside";
import { useFocusTrap } from "@/src/presentation/hooks/use-focus-trap";
import { useMounted } from "@/src/presentation/hooks/use-mounted";

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  side?: "left" | "right";
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Drawer({
  open,
  onClose,
  side = "right",
  title,
  children,
  className,
}: DrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const mounted = useMounted();

  useEscapeKey(onClose, open);
  useClickOutside(panelRef, onClose, open);
  useFocusTrap(panelRef, open);

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
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-foreground/50" aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        className={cn(
          "absolute top-0 flex h-full w-full max-w-sm flex-col border-border bg-card text-card-foreground shadow-xl focus:outline-none",
          side === "right" ? "right-0 border-l" : "left-0 border-r",
          className,
        )}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-border p-5">
            <h2 className="text-lg font-semibold">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="ปิด"
              className="text-muted transition-colors hover:text-foreground"
            >
              <X className="size-5" />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
