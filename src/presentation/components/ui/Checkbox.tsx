// Checkbox — ซ่อน input จริง, วาด box เองด้วย token (checked = bg-brand-500)
import { forwardRef, type InputHTMLAttributes } from "react";
import { Check } from "lucide-react";

import { cn } from "@/src/presentation/components/ui/cn";

export type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, ...props }, ref) => {
    return (
      <span className="relative inline-flex size-5 shrink-0">
        <input
          ref={ref}
          type="checkbox"
          className={cn(
            "peer size-5 cursor-pointer appearance-none rounded-md border border-border bg-card",
            "transition-colors checked:border-brand-500 checked:bg-brand-500",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            "disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}
          {...props}
        />
        <Check className="pointer-events-none absolute inset-0 m-auto size-3.5 text-on-brand opacity-0 peer-checked:opacity-100" />
      </span>
    );
  },
);

Checkbox.displayName = "Checkbox";
