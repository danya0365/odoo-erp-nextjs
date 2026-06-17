// Multiline text input — ผูก token + รองรับ error/disabled
import { forwardRef, type TextareaHTMLAttributes } from "react";

import { cn } from "@/src/presentation/components/ui/cn";

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, "aria-invalid": ariaInvalid, rows = 4, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        rows={rows}
        aria-invalid={ariaInvalid ?? error ?? undefined}
        className={cn(
          "w-full rounded-xl border bg-card px-3.5 py-2.5 text-base text-foreground",
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

Textarea.displayName = "Textarea";
