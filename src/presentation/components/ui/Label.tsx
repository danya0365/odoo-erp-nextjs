// Label — ผูก control + ตัวบอก required
import { type LabelHTMLAttributes } from "react";

import { cn } from "@/src/presentation/components/ui/cn";

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export function Label({ className, required, children, ...props }: LabelProps) {
  return (
    <label
      className={cn("text-sm font-medium text-foreground", className)}
      {...props}
    >
      {children}
      {required && <span className="ml-0.5 text-error">*</span>}
    </label>
  );
}
