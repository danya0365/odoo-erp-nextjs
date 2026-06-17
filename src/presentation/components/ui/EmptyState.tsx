// EmptyState — สถานะว่าง: ไอคอน + title + description + action slot
import { type ReactNode } from "react";
import { type LucideIcon } from "lucide-react";

import { cn } from "@/src/presentation/components/ui/cn";

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-border bg-card px-6 py-12 text-center",
        className,
      )}
    >
      {Icon && (
        <span className="mb-4 inline-flex rounded-2xl bg-brand-50 p-4 text-brand-600">
          <Icon className="size-7" />
        </span>
      )}
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
