// Skeleton — placeholder ตอนโหลดข้อมูล
import { type HTMLAttributes } from "react";

import { cn } from "@/src/presentation/components/ui/cn";

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted-surface", className)}
      {...props}
    />
  );
}
