"use client";

import { useActionState } from "react";

import {
  generatePayrollRunAction,
  type FormState,
} from "@/src/presentation/actions/hr-actions";
import { FormField } from "@/src/presentation/components/ui/FormField";
import { Input } from "@/src/presentation/components/ui/Input";
import { Button } from "@/src/presentation/components/ui/Button";
import { Alert } from "@/src/presentation/components/ui/Alert";

export function PayrollRunForm({ defaultPeriod }: { defaultPeriod: string }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    generatePayrollRunAction,
    {},
  );
  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error && <Alert variant="error">{state.error}</Alert>}
      <FormField label="งวด (YYYY-MM)" required>
        <Input name="period" defaultValue={defaultPeriod} placeholder="2026-06" />
      </FormField>
      <FormField label="ภาษีหัก ณ ที่จ่าย (%)">
        <Input name="whtRate" inputMode="decimal" placeholder="3" defaultValue="3" />
      </FormField>
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "กำลังสร้าง…" : "สร้างงวดเงินเดือน"}
        </Button>
      </div>
    </form>
  );
}
