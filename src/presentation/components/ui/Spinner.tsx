// Spinner — วงหมุนโหลด ใช้สี brand
import { cn } from "@/src/presentation/components/ui/cn";

type SpinnerSize = "sm" | "md" | "lg";

export interface SpinnerProps {
  size?: SpinnerSize;
  className?: string;
  label?: string;
}

const SIZES: Record<SpinnerSize, string> = {
  sm: "size-4 border-2",
  md: "size-6 border-2",
  lg: "size-9 border-[3px]",
};

export function Spinner({ size = "md", className, label = "กำลังโหลด" }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn(
        "inline-block animate-spin rounded-full border-brand-500 border-t-transparent",
        SIZES[size],
        className,
      )}
    />
  );
}
