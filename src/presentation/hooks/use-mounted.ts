"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/**
 * คืน false ตอน SSR / ก่อน hydrate, true หลัง mount ฝั่ง client —
 * ใช้ guard ก่อนเรียก createPortal (เลี่ยง setState ใน effect).
 */
export function useMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}
