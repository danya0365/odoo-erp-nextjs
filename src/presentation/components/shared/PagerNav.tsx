// reuse Pagination (client) บนหน้า server list — เปลี่ยนหน้าโดย push ?page=
"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

import { Pagination } from "@/src/presentation/components/ui/Pagination";

export function PagerNav({ page, totalPages }: { page: number; totalPages: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  if (totalPages <= 1) return null;

  return (
    <Pagination
      page={page}
      totalPages={totalPages}
      onPageChange={(p) => {
        const q = new URLSearchParams(sp);
        q.set("page", String(p));
        router.push(`${pathname}?${q.toString()}`);
      }}
    />
  );
}
