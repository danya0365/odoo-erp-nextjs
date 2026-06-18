"use client";

import { useActionState } from "react";

import { logTimesheetAction, type FormState } from "@/src/presentation/actions/project-actions";
import { FormField } from "@/src/presentation/components/ui/FormField";
import { Select } from "@/src/presentation/components/ui/Select";
import { Input } from "@/src/presentation/components/ui/Input";
import { Button } from "@/src/presentation/components/ui/Button";
import { Alert } from "@/src/presentation/components/ui/Alert";

export interface Option {
  id: string;
  name: string;
}

export function TimesheetForm({
  projectId,
  employees,
  tasks,
  defaultDate,
}: {
  projectId: string;
  employees: Option[];
  tasks: Option[];
  defaultDate: string;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(logTimesheetAction, {});
  return (
    <form action={formAction} className="flex flex-col gap-3">
      {state.error && <Alert variant="error">{state.error}</Alert>}
      {state.success && <Alert variant="success">{state.success}</Alert>}
      <input type="hidden" name="projectId" value={projectId} />
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField label="พนักงาน" required>
          <Select name="employeeId" defaultValue="" aria-label="พนักงาน">
            <option value="" disabled>— เลือกพนักงาน —</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </Select>
        </FormField>
        <FormField label="งาน">
          <Select name="taskId" defaultValue="" aria-label="งาน">
            <option value="">— ทั้งโครงการ —</option>
            {tasks.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </Select>
        </FormField>
        <FormField label="ชั่วโมง" required>
          <Input name="hours" inputMode="decimal" placeholder="1.5" />
        </FormField>
        <FormField label="วันที่" required>
          <Input name="date" type="date" defaultValue={defaultDate} />
        </FormField>
      </div>
      <FormField label="บันทึก">
        <Input name="note" placeholder="(ไม่บังคับ)" />
      </FormField>
      <div>
        <Button type="submit" disabled={pending || employees.length === 0}>
          {pending ? "กำลังบันทึก…" : "ลงเวลา"}
        </Button>
      </div>
    </form>
  );
}
