"use client";

import { useActionState } from "react";

import { createEmployeeAction, type FormState } from "@/src/presentation/actions/hr-actions";
import { FormField } from "@/src/presentation/components/ui/FormField";
import { Input } from "@/src/presentation/components/ui/Input";
import { Button } from "@/src/presentation/components/ui/Button";
import { Alert } from "@/src/presentation/components/ui/Alert";

export function EmployeeForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(createEmployeeAction, {});
  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error && <Alert variant="error">{state.error}</Alert>}
      {state.success && <Alert variant="success">{state.success}</Alert>}
      <div className="grid gap-4 sm:grid-cols-3">
        <FormField label="ชื่อพนักงาน" required>
          <Input name="name" />
        </FormField>
        <FormField label="ตำแหน่ง">
          <Input name="position" />
        </FormField>
        <FormField label="เงินเดือน (บาท)" required>
          <Input name="baseSalary" inputMode="decimal" placeholder="0" />
        </FormField>
      </div>
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "กำลังบันทึก…" : "เพิ่มพนักงาน"}
        </Button>
      </div>
    </form>
  );
}
