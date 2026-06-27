"use client";

import { useActionState } from "react";

import { importBankLineAction, type FormState } from "@/src/presentation/actions/bank-actions";
import { FormField } from "@/src/presentation/components/ui/FormField";
import { Input } from "@/src/presentation/components/ui/Input";
import { Button } from "@/src/presentation/components/ui/Button";
import { Alert } from "@/src/presentation/components/ui/Alert";

export function BankImportForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(importBankLineAction, {});
  return (
    <form action={formAction} className="space-y-3">
      {state.error && <Alert variant="error">{state.error}</Alert>}
      {state.success && <Alert variant="success">{state.success}</Alert>}
      <div className="grid gap-3 sm:grid-cols-3">
        <FormField label="วันที่" required>
          <Input name="statementDate" type="date" aria-label="วันที่" />
        </FormField>
        <FormField label="รายละเอียด">
          <Input name="description" placeholder="เช่น โอนรับจากลูกค้า" />
        </FormField>
        <FormField label="จำนวน (+เข้า/−ออก)" required>
          <Input name="amount" inputMode="decimal" placeholder="เช่น 1000 หรือ -500" aria-label="จำนวน" />
        </FormField>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "กำลังนำเข้า…" : "นำเข้ารายการ"}
      </Button>
    </form>
  );
}
