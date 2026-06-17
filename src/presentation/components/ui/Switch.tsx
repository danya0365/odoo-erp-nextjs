// Switch toggle — track bg-muted-surface → bg-brand-500 เมื่อ checked, knob เลื่อน
import { forwardRef, type InputHTMLAttributes } from "react";

import { cn } from "@/src/presentation/components/ui/cn";

export type SwitchProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "role"
>;

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, ...props }, ref) => {
    return (
      <label className="relative inline-flex cursor-pointer items-center">
        <input
          ref={ref}
          type="checkbox"
          role="switch"
          className="peer sr-only"
          {...props}
        />
        <span
          className={cn(
            "h-6 w-11 rounded-full bg-muted-surface transition-colors peer-checked:bg-brand-500",
            "peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background",
            "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
            className,
          )}
        />
        <span className="pointer-events-none absolute left-0.5 size-5 rounded-full bg-card shadow-sm transition-transform peer-checked:translate-x-5" />
      </label>
    );
  },
);

Switch.displayName = "Switch";
