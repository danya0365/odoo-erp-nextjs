// Native <select> จัด style + chevron — เสถียร/เข้าถึงง่ายกว่า custom สำหรับ form
import { forwardRef, type SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/src/presentation/components/ui/cn";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, "aria-invalid": ariaInvalid, children, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          ref={ref}
          aria-invalid={ariaInvalid ?? error ?? undefined}
          className={cn(
            "h-11 w-full appearance-none rounded-xl border bg-card pl-3.5 pr-10 text-base text-foreground",
            "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error
              ? "border-error focus-visible:ring-error"
              : "border-border focus-visible:ring-ring",
            className,
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
      </div>
    );
  },
);

Select.displayName = "Select";
