"use client";

import { useActionState } from "react";

import {
  adjustStockAction,
  type FormState,
} from "@/src/presentation/actions/product-actions";
import { FormField } from "@/src/presentation/components/ui/FormField";
import { Input } from "@/src/presentation/components/ui/Input";
import { Select } from "@/src/presentation/components/ui/Select";
import { Button } from "@/src/presentation/components/ui/Button";
import { Alert } from "@/src/presentation/components/ui/Alert";

export function AdjustStockForm({ productId }: { productId: string }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    adjustStockAction,
    {},
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      {state.error && <Alert variant="error">{state.error}</Alert>}
      {state.success && <Alert variant="success">{state.success}</Alert>}
      <input type="hidden" name="id" value={productId} />
      <div className="grid gap-3 sm:grid-cols-3">
        <FormField label="ทิศทาง">
          <Select name="direction" defaultValue="in">
            <option value="in">รับเข้า (+)</option>
            <option value="out">จ่ายออก (−)</option>
          </Select>
        </FormField>
        <FormField label="จำนวน">
          <Input name="qty" inputMode="decimal" placeholder="เช่น 10" />
        </FormField>
        <FormField label="หมายเหตุ">
          <Input name="note" placeholder="(ไม่บังคับ)" />
        </FormField>
      </div>
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "กำลังปรับ…" : "ปรับสต๊อก"}
        </Button>
      </div>
    </form>
  );
}
