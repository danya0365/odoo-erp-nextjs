"use client";

import { useActionState } from "react";

import { createExpenseClaimAction, type FormState } from "@/src/presentation/actions/expense-actions";
import { FormField } from "@/src/presentation/components/ui/FormField";
import { Input } from "@/src/presentation/components/ui/Input";
import { Select } from "@/src/presentation/components/ui/Select";
import { Textarea } from "@/src/presentation/components/ui/Textarea";
import { Button } from "@/src/presentation/components/ui/Button";
import { Alert } from "@/src/presentation/components/ui/Alert";

export interface ExpenseEmployeeOption {
  id: string;
  name: string;
}

export function ExpenseClaimForm({ employees }: { employees: ExpenseEmployeeOption[] }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(createExpenseClaimAction, {});
  return (
    <form action={formAction} className="space-y-4">
      {state.error && <Alert variant="error">{state.error}</Alert>}
      <FormField label="พนักงาน" required>
        <Select name="employeeId" aria-label="พนักงาน">
          <option value="">— เลือกพนักงาน —</option>
          {employees.map((e) => (
            <option key={e.id} value={e.id}>{e.name}</option>
          ))}
        </Select>
      </FormField>
      <FormField label="หมวดค่าใช้จ่าย">
        <Select name="category" defaultValue="ทั่วไป" aria-label="หมวดค่าใช้จ่าย">
          <option value="ทั่วไป">ทั่วไป</option>
          <option value="เดินทาง">เดินทาง</option>
          <option value="อาหาร/รับรอง">อาหาร/รับรอง</option>
          <option value="อุปกรณ์">อุปกรณ์</option>
        </Select>
      </FormField>
      <FormField label="จำนวนเงิน (บาท)" required>
        <Input name="amount" inputMode="decimal" placeholder="0.00" />
      </FormField>
      <FormField label="รายละเอียด">
        <Textarea name="description" rows={2} placeholder="เช่น ค่าแท็กซี่ไปพบลูกค้า…" />
      </FormField>
      <Button type="submit" disabled={pending}>
        {pending ? "กำลังยื่น…" : "ยื่นเบิกค่าใช้จ่าย"}
      </Button>
    </form>
  );
}
