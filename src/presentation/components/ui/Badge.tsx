// Badge — chip สถานะ/หมวดหมู่ ใช้ token (*-surface + text-*)
import { type HTMLAttributes } from "react";

import { cn } from "@/src/presentation/components/ui/cn";

type BadgeVariant = "neutral" | "brand" | "success" | "warning" | "error";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const VARIANTS: Record<BadgeVariant, string> = {
  neutral: "bg-muted-surface text-foreground",
  brand: "bg-brand-50 text-brand-700",
  success: "bg-success-surface text-success",
  warning: "bg-warning-surface text-warning",
  error: "bg-error-surface text-error",
};

export function Badge({ className, variant = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        VARIANTS[variant],
        className,
      )}
      {...props}
    />
  );
}
