// Alert/Callout — แจ้งเตือนแบบ inline พร้อมไอคอน ใช้ token ตาม variant
import { type ReactNode } from "react";
import {
  Info,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/src/presentation/components/ui/cn";

type AlertVariant = "info" | "success" | "warning" | "error";

export interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children?: ReactNode;
  className?: string;
}

const CONFIG: Record<AlertVariant, { icon: LucideIcon; surface: string; text: string }> = {
  info: { icon: Info, surface: "bg-muted-surface", text: "text-foreground" },
  success: { icon: CheckCircle2, surface: "bg-success-surface", text: "text-success" },
  warning: { icon: AlertTriangle, surface: "bg-warning-surface", text: "text-warning" },
  error: { icon: XCircle, surface: "bg-error-surface", text: "text-error" },
};

export function Alert({ variant = "info", title, children, className }: AlertProps) {
  const { icon: Icon, surface, text } = CONFIG[variant];
  return (
    <div
      role="alert"
      className={cn("flex gap-3 rounded-xl p-4", surface, className)}
    >
      <Icon className={cn("mt-0.5 size-5 shrink-0", text)} />
      <div className="flex flex-col gap-0.5">
        {title && <p className={cn("font-medium", text)}>{title}</p>}
        {children && (
          <div className="text-sm text-foreground/80">{children}</div>
        )}
      </div>
    </div>
  );
}
