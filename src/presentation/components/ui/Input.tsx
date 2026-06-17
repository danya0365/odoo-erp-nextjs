// Text input — ผูก token + รองรับ error/disabled
import { forwardRef, type InputHTMLAttributes } from "react";

import { cn } from "@/src/presentation/components/ui/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, "aria-invalid": ariaInvalid, ...props }, ref) => {
    return (
      <input
        ref={ref}
        aria-invalid={ariaInvalid ?? error ?? undefined}
        className={cn(
          "h-11 w-full rounded-xl border bg-card px-3.5 text-base text-foreground",
          "placeholder:text-muted",
          "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "disabled:cursor-not-allowed disabled:opacity-50",
          error
            ? "border-error focus-visible:ring-error"
            : "border-border focus-visible:ring-ring",
          className,
        )}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";
