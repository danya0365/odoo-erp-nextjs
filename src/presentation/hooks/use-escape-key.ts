"use client";

import { useEffect } from "react";

/** เรียก handler เมื่อกด Escape (ปิด overlay). ปิดการทำงานได้ด้วย enabled=false. */
export function useEscapeKey(handler: () => void, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handler();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [handler, enabled]);
}
