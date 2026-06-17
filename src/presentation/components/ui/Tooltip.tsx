// Tooltip — เขียนเอง: แสดงบน hover/focus (ตำแหน่ง top), พื้น foreground/background
"use client";

import { useState, type ReactNode } from "react";

import { cn } from "@/src/presentation/components/ui/cn";

export interface TooltipProps {
  label: string;
  children: ReactNode;
  className?: string;
}

export function Tooltip({ label, children, className }: TooltipProps) {
  const [show, setShow] = useState(false);

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
    >
      {children}
      {show && (
        <span
          role="tooltip"
          className={cn(
            "pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap",
            "rounded-md bg-foreground px-2 py-1 text-xs text-background shadow-md",
            className,
          )}
        >
          {label}
        </span>
      )}
    </span>
  );
}
