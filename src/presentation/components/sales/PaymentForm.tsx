"use client";

import { useActionState } from "react";

import {
  registerPaymentAction,
  type FormState,
} from "@/src/presentation/actions/sales-actions";
import { FormField } from "@/src/presentation/components/ui/FormField";
import { Input } from "@/src/presentation/components/ui/Input";
import { Button } from "@/src/presentation/components/ui/Button";
import { Alert } from "@/src/presentation/components/ui/Alert";

export function PaymentForm({
  orderId,
  invoiceId,
  amountDue,
}: {
  orderId: string;
  invoiceId: string;
  amountDue: string; // formatted e.g. "214.00"
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    registerPaymentAction,
    {},
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      {state.error && <Alert variant="error">{state.error}</Alert>}
      {state.success && <Alert variant="success">{state.success}</Alert>}
      <input type="hidden" name="orderId" value={orderId} />
      <input type="hidden" name="invoiceId" value={invoiceId} />
      <div className="flex items-end gap-3">
        <FormField label="จำนวนเงิน (บาท)">
          <Input name="amount" inputMode="decimal" defaultValue={amountDue} />
        </FormField>
        <Button type="submit" disabled={pending}>
          {pending ? "กำลังบันทึก…" : "รับชำระ"}
        </Button>
      </div>
    </form>
  );
}
