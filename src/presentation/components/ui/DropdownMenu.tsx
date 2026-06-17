// DropdownMenu — เขียนเอง: trigger + เมนูลอย, click-outside / ESC / ลูกศรขึ้นลง / Enter
"use client";

import {
  useCallback,
  useRef,
  type KeyboardEvent,
  type ReactNode,
} from "react";

import { cn } from "@/src/presentation/components/ui/cn";
import { useDisclosure } from "@/src/presentation/hooks/use-disclosure";
import { useEscapeKey } from "@/src/presentation/hooks/use-escape-key";
import { useClickOutside } from "@/src/presentation/hooks/use-click-outside";

export interface DropdownMenuProps {
  trigger: ReactNode;
  children: ReactNode;
  align?: "start" | "end";
  className?: string;
}

export function DropdownMenu({
  trigger,
  children,
  align = "start",
  className,
}: DropdownMenuProps) {
  const { isOpen, toggle, close } = useDisclosure();
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEscapeKey(close, isOpen);
  useClickOutside(rootRef, close, isOpen);

  // เลื่อน focus ระหว่าง item ด้วยลูกศร
  const onMenuKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
    if (!["ArrowDown", "ArrowUp"].includes(e.key)) return;
    e.preventDefault();
    const items = Array.from(
      menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? [],
    );
    if (items.length === 0) return;
    const idx = items.indexOf(document.activeElement as HTMLButtonElement);
    const next =
      e.key === "ArrowDown"
        ? items[(idx + 1) % items.length]
        : items[(idx - 1 + items.length) % items.length];
    next.focus();
  }, []);

  return (
    <div ref={rootRef} className="relative inline-block">
      <div
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className="inline-flex"
      >
        {trigger}
      </div>
      {isOpen && (
        <div
          ref={menuRef}
          role="menu"
          onKeyDown={onMenuKeyDown}
          className={cn(
            "absolute z-50 mt-2 min-w-44 overflow-hidden rounded-xl border border-border bg-card p-1 shadow-lg",
            align === "end" ? "right-0" : "left-0",
            className,
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export interface DropdownItemProps {
  children: ReactNode;
  onSelect?: () => void;
  disabled?: boolean;
  className?: string;
}

export function DropdownItem({
  children,
  onSelect,
  disabled,
  className,
}: DropdownItemProps) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-foreground",
        "transition-colors hover:bg-muted-surface focus-visible:bg-muted-surface focus-visible:outline-none",
        "disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
    >
      {children}
    </button>
  );
}
