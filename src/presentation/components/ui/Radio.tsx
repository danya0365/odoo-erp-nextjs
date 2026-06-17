// Radio — ซ่อน input จริง, วาดวง + dot เองด้วย token
import { forwardRef, type InputHTMLAttributes } from "react";

import { cn } from "@/src/presentation/components/ui/cn";

export type RadioProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ className, ...props }, ref) => {
    return (
      <span className="relative inline-flex size-5 shrink-0">
        <input
          ref={ref}
          type="radio"
          className={cn(
            "peer size-5 cursor-pointer appearance-none rounded-full border border-border bg-card",
            "transition-colors checked:border-brand-500",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            "disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}
          {...props}
        />
        <span className="pointer-events-none absolute inset-0 m-auto size-2.5 rounded-full bg-brand-500 opacity-0 peer-checked:opacity-100" />
      </span>
    );
  },
);

Radio.displayName = "Radio";
