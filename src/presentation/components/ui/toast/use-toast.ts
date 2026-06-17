// useToast() — เรียก toast({title,description,variant}) ได้ทุกที่ใต้ <ToastProvider>
"use client";

import { useContext } from "react";

import { ToastContext } from "@/src/presentation/components/ui/toast/ToastProvider";

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast ต้องอยู่ภายใน <ToastProvider>");
  }
  return ctx;
}
