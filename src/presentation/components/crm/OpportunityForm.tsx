"use client";

import { useActionState } from "react";

import {
  createOpportunityAction,
  type FormState,
} from "@/src/presentation/actions/crm-actions";
import { FormField } from "@/src/presentation/components/ui/FormField";
import { Input } from "@/src/presentation/components/ui/Input";
import { Select } from "@/src/presentation/components/ui/Select";
import { Button } from "@/src/presentation/components/ui/Button";
import { Alert } from "@/src/presentation/components/ui/Alert";

export interface CustomerOption {
  id: string;
  name: string;
}

export function OpportunityForm({ customers }: { customers: CustomerOption[] }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    createOpportunityAction,
    {},
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error && <Alert variant="error">{state.error}</Alert>}

      <FormField label="ชื่อโอกาสการขาย" required>
        <Input name="name" placeholder="เช่น ขายระบบให้บริษัท ก" />
      </FormField>

      <FormField label="ลูกค้า">
        <Select name="partnerId" defaultValue="">
          <option value="">— ไม่ระบุ —</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="ชื่อผู้ติดต่อ">
          <Input name="contactName" />
        </FormField>
        <FormField label="อีเมล">
          <Input name="email" type="email" />
        </FormField>
        <FormField label="โทรศัพท์">
          <Input name="phone" />
        </FormField>
        <FormField label="รายได้คาดหวัง (บาท)">
          <Input name="expectedRevenue" inputMode="decimal" placeholder="0" />
        </FormField>
        <FormField label="ความน่าจะเป็น (%)">
          <Input name="probability" inputMode="numeric" placeholder="0" />
        </FormField>
      </div>

      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "กำลังบันทึก…" : "สร้างโอกาสการขาย"}
        </Button>
      </div>
    </form>
  );
}
