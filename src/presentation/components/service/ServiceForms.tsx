"use client";

import { useActionState } from "react";

import { createServiceTicketAction, assignServiceTicketAction, type FormState } from "@/src/presentation/actions/service-actions";
import { FormField } from "@/src/presentation/components/ui/FormField";
import { Input } from "@/src/presentation/components/ui/Input";
import { Select } from "@/src/presentation/components/ui/Select";
import { Textarea } from "@/src/presentation/components/ui/Textarea";
import { Button } from "@/src/presentation/components/ui/Button";
import { Alert } from "@/src/presentation/components/ui/Alert";

export interface Option {
  id: string;
  name: string;
}

export function ServiceTicketForm({ customers }: { customers: Option[] }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(createServiceTicketAction, {});
  return (
    <form action={formAction} className="space-y-3">
      {state.error && <Alert variant="error">{state.error}</Alert>}
      <FormField label="ลูกค้า" required>
        <Select name="customerId" aria-label="ลูกค้า">
          <option value="">— เลือกลูกค้า —</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
      </FormField>
      <FormField label="เรื่อง/ปัญหา" required>
        <Input name="subject" placeholder="เช่น แอร์ไม่เย็น" aria-label="เรื่อง" />
      </FormField>
      <FormField label="รายละเอียด">
        <Textarea name="description" rows={3} />
      </FormField>
      <Button type="submit" disabled={pending}>{pending ? "กำลังเปิด…" : "เปิดใบงาน"}</Button>
    </form>
  );
}

export function AssignForm({ id, employees }: { id: string; employees: Option[] }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(assignServiceTicketAction, {});
  return (
    <form action={formAction} className="space-y-3">
      {state.error && <Alert variant="error">{state.error}</Alert>}
      {state.success && <Alert variant="success">{state.success}</Alert>}
      <input type="hidden" name="id" value={id} />
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField label="มอบหมายช่าง/พนักงาน" required>
          <Select name="assigneeId" aria-label="ช่าง">
            <option value="">— เลือกช่าง —</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </Select>
        </FormField>
        <FormField label="นัดหมาย (วัน-เวลา)">
          <Input name="scheduledAt" type="datetime-local" aria-label="นัดหมาย" />
        </FormField>
      </div>
      <Button type="submit" disabled={pending}>{pending ? "กำลังมอบหมาย…" : "มอบหมาย + นัดหมาย"}</Button>
    </form>
  );
}
