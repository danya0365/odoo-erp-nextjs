// Pagination — prev/next + เลขหน้า (active = bg-brand-500 text-on-brand)
"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/src/presentation/components/ui/cn";

export interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

function pageList(page: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "...")[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(total - 1, page + 1);
  if (start > 2) pages.push("...");
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total - 1) pages.push("...");
  pages.push(total);
  return pages;
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
  className,
}: PaginationProps) {
  const go = (p: number) => p >= 1 && p <= totalPages && onPageChange(p);
  const base =
    "inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm transition-colors disabled:pointer-events-none disabled:opacity-40";

  return (
    <nav aria-label="pagination" className={cn("flex items-center gap-1", className)}>
      <button
        type="button"
        onClick={() => go(page - 1)}
        disabled={page <= 1}
        aria-label="ก่อนหน้า"
        className={cn(base, "text-muted hover:bg-muted-surface hover:text-foreground")}
      >
        <ChevronLeft className="size-4" />
      </button>

      {pageList(page, totalPages).map((p, i) =>
        p === "..." ? (
          <span key={`gap-${i}`} className="px-1 text-muted">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => go(p)}
            aria-current={p === page ? "page" : undefined}
            className={cn(
              base,
              p === page
                ? "bg-brand-500 text-on-brand"
                : "text-foreground hover:bg-muted-surface",
            )}
          >
            {p}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => go(page + 1)}
        disabled={page >= totalPages}
        aria-label="ถัดไป"
        className={cn(base, "text-muted hover:bg-muted-surface hover:text-foreground")}
      >
        <ChevronRight className="size-4" />
      </button>
    </nav>
  );
}
