"use client";

import { useActionState } from "react";

import { createInstallmentPlanAction, type FormState } from "@/src/presentation/actions/installment-actions";
import { FormField } from "@/src/presentation/components/ui/FormField";
import { Input } from "@/src/presentation/components/ui/Input";
import { Button } from "@/src/presentation/components/ui/Button";
import { Alert } from "@/src/presentation/components/ui/Alert";

export function InstallmentForm({ invoiceId }: { invoiceId: string }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(createInstallmentPlanAction, {});
  return (
    <form action={formAction} className="space-y-4">
      {state.error && <Alert variant="error">{state.error}</Alert>}
      <input type="hidden" name="invoiceId" value={invoiceId} />
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField label="จำนวนงวด" required>
          <Input name="count" type="number" inputMode="numeric" defaultValue="3" aria-label="จำนวนงวด" />
        </FormField>
        <FormField label="ระยะห่างต่องวด (วัน)" required>
          <Input name="intervalDays" type="number" inputMode="numeric" defaultValue="30" aria-label="ระยะห่างต่องวด" />
        </FormField>
      </div>
      <p className="text-sm text-muted">งวดแรก = มัดจำ (ครบกำหนดวันนี้) · ที่เหลือแบ่งเท่ากัน</p>
      <Button type="submit" disabled={pending}>
        {pending ? "กำลังตั้งแผน…" : "ตั้งแผนผ่อนชำระ"}
      </Button>
    </form>
  );
}
