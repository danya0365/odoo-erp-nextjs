"use client";

import { useActionState } from "react";

import { logAttendanceAction, createLeaveAction, type FormState } from "@/src/presentation/actions/timeoff-actions";
import { FormField } from "@/src/presentation/components/ui/FormField";
import { Input } from "@/src/presentation/components/ui/Input";
import { Select } from "@/src/presentation/components/ui/Select";
import { Textarea } from "@/src/presentation/components/ui/Textarea";
import { Button } from "@/src/presentation/components/ui/Button";
import { Alert } from "@/src/presentation/components/ui/Alert";

export interface EmployeeOption {
  id: string;
  name: string;
}

function EmployeeSelect({ employees, label }: { employees: EmployeeOption[]; label: string }) {
  return (
    <FormField label="พนักงาน" required>
      <Select name="employeeId" aria-label={label}>
        <option value="">— เลือกพนักงาน —</option>
        {employees.map((e) => (
          <option key={e.id} value={e.id}>{e.name}</option>
        ))}
      </Select>
    </FormField>
  );
}

export function AttendanceForm({ employees }: { employees: EmployeeOption[] }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(logAttendanceAction, {});
  return (
    <form action={formAction} className="space-y-3">
      {state.error && <Alert variant="error">{state.error}</Alert>}
      {state.success && <Alert variant="success">{state.success}</Alert>}
      <EmployeeSelect employees={employees} label="พนักงานลงเวลา" />
      <div className="grid gap-3 sm:grid-cols-3">
        <FormField label="วันที่" required>
          <Input name="workDate" type="date" aria-label="วันที่ลงเวลา" />
        </FormField>
        <FormField label="ชั่วโมงทำงาน">
          <Input name="hours" inputMode="decimal" placeholder="8" aria-label="ชั่วโมงทำงาน" />
        </FormField>
        <FormField label="OT (ชม.)">
          <Input name="ot" inputMode="decimal" placeholder="0" aria-label="โอที" />
        </FormField>
      </div>
      <Button type="submit" disabled={pending}>{pending ? "กำลังบันทึก…" : "ลงเวลา"}</Button>
    </form>
  );
}

export function LeaveForm({ employees }: { employees: EmployeeOption[] }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(createLeaveAction, {});
  return (
    <form action={formAction} className="space-y-3">
      {state.error && <Alert variant="error">{state.error}</Alert>}
      {state.success && <Alert variant="success">{state.success}</Alert>}
      <EmployeeSelect employees={employees} label="พนักงานขอลา" />
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField label="ประเภทการลา" required>
          <Select name="leaveType" defaultValue="personal" aria-label="ประเภทการลา">
            <option value="personal">ลากิจ</option>
            <option value="sick">ลาป่วย</option>
            <option value="vacation">ลาพักร้อน</option>
          </Select>
        </FormField>
        <FormField label="จำนวนวัน" required>
          <Input name="days" inputMode="decimal" placeholder="1" aria-label="จำนวนวันลา" />
        </FormField>
      </div>
      <FormField label="เหตุผล">
        <Textarea name="reason" rows={2} />
      </FormField>
      <Button type="submit" disabled={pending}>{pending ? "กำลังยื่น…" : "ยื่นขอลา"}</Button>
    </form>
  );
}
