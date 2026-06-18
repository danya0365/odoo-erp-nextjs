"use client";

import { useActionState } from "react";

import {
  registerBillPaymentAction,
  type FormState,
} from "@/src/presentation/actions/purchase-actions";
import { FormField } from "@/src/presentation/components/ui/FormField";
import { Input } from "@/src/presentation/components/ui/Input";
import { Button } from "@/src/presentation/components/ui/Button";
import { Alert } from "@/src/presentation/components/ui/Alert";

export function BillPaymentForm({
  orderId,
  billId,
  amountDue,
}: {
  orderId: string;
  billId: string;
  amountDue: string;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    registerBillPaymentAction,
    {},
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      {state.error && <Alert variant="error">{state.error}</Alert>}
      {state.success && <Alert variant="success">{state.success}</Alert>}
      <input type="hidden" name="orderId" value={orderId} />
      <input type="hidden" name="billId" value={billId} />
      <div className="flex items-end gap-3">
        <FormField label="จำนวนเงิน (บาท)">
          <Input name="amount" inputMode="decimal" defaultValue={amountDue} />
        </FormField>
        <Button type="submit" disabled={pending}>
          {pending ? "กำลังบันทึก…" : "จ่ายเงิน"}
        </Button>
      </div>
    </form>
  );
}
