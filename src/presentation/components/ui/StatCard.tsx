// StatCard — KPI card: label + value + delta (เขียว/แดง) + ไอคอน; ต่อยอดจาก Card
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";

import { cn } from "@/src/presentation/components/ui/cn";
import { Card } from "@/src/presentation/components/ui/Card";

export interface StatCardProps {
  label: string;
  value: string;
  /** %เปลี่ยนแปลง: บวก = เขียว, ลบ = แดง */
  delta?: number;
  icon?: LucideIcon;
  className?: string;
}

export function StatCard({ label, value, delta, icon: Icon, className }: StatCardProps) {
  const up = (delta ?? 0) >= 0;
  return (
    <Card className={cn("p-5", className)}>
      <div className="flex items-start justify-between">
        <p className="text-sm text-muted">{label}</p>
        {Icon && (
          <span className="inline-flex rounded-lg bg-brand-50 p-2 text-brand-600">
            <Icon className="size-4" />
          </span>
        )}
      </div>
      <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
      {delta !== undefined && (
        <p
          className={cn(
            "mt-1 inline-flex items-center gap-0.5 text-sm font-medium",
            up ? "text-success" : "text-error",
          )}
        >
          {up ? (
            <ArrowUpRight className="size-4" />
          ) : (
            <ArrowDownRight className="size-4" />
          )}
          {Math.abs(delta)}%
        </p>
      )}
    </Card>
  );
}
