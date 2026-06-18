"use client";

import { useActionState } from "react";

import { produceMoAction, type FormState } from "@/src/presentation/actions/manufacturing-actions";
import { Button } from "@/src/presentation/components/ui/Button";
import { Alert } from "@/src/presentation/components/ui/Alert";

export function ProduceButton({ orderId, disabled }: { orderId: string; disabled: boolean }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(produceMoAction, {});
  return (
    <form action={formAction} className="space-y-2">
      {state.error && <Alert variant="error">{state.error}</Alert>}
      <input type="hidden" name="id" value={orderId} />
      <Button type="submit" disabled={pending || disabled}>
        {pending ? "กำลังผลิต…" : "ผลิต (ตัดวัตถุดิบ + รับสินค้า)"}
      </Button>
      {disabled && <p className="text-sm text-error">วัตถุดิบไม่พอสำหรับการผลิต</p>}
    </form>
  );
}
