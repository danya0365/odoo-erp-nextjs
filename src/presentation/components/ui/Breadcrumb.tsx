// Breadcrumb — รายการเส้นทาง + separator chevron; ตัวสุดท้าย = หน้าปัจจุบัน
import { Fragment } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { cn } from "@/src/presentation/components/ui/cn";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav aria-label="breadcrumb" className={cn("flex items-center gap-1.5 text-sm", className)}>
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <Fragment key={`${item.label}-${i}`}>
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="text-muted transition-colors hover:text-foreground"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={isLast ? "font-medium text-foreground" : "text-muted"}
                aria-current={isLast ? "page" : undefined}
              >
                {item.label}
              </span>
            )}
            {!isLast && <ChevronRight className="size-4 text-muted" />}
          </Fragment>
        );
      })}
    </nav>
  );
}
