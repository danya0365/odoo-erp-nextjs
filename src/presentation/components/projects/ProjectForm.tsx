"use client";

import { useActionState } from "react";

import { createProjectAction, type FormState } from "@/src/presentation/actions/project-actions";
import { FormField } from "@/src/presentation/components/ui/FormField";
import { Input } from "@/src/presentation/components/ui/Input";
import { Select } from "@/src/presentation/components/ui/Select";
import { Button } from "@/src/presentation/components/ui/Button";
import { Alert } from "@/src/presentation/components/ui/Alert";

export interface CustomerOption {
  id: string;
  name: string;
}

export function ProjectForm({ customers }: { customers: CustomerOption[] }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(createProjectAction, {});
  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error && <Alert variant="error">{state.error}</Alert>}
      <FormField label="ชื่อโครงการ" required>
        <Input name="name" placeholder="เช่น พัฒนาเว็บไซต์ลูกค้า ก" />
      </FormField>
      <FormField label="ลูกค้า">
        <Select name="customerId" defaultValue="">
          <option value="">— ไม่ระบุ —</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
      </FormField>
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "กำลังบันทึก…" : "สร้างโครงการ"}
        </Button>
      </div>
    </form>
  );
}
