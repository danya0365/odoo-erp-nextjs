"use client";

import { useActionState } from "react";

import { createTaskAction, type FormState } from "@/src/presentation/actions/project-actions";
import { Input } from "@/src/presentation/components/ui/Input";
import { Button } from "@/src/presentation/components/ui/Button";
import { Alert } from "@/src/presentation/components/ui/Alert";

export function TaskForm({ projectId }: { projectId: string }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(createTaskAction, {});
  return (
    <form action={formAction} className="flex items-start gap-2">
      <input type="hidden" name="projectId" value={projectId} />
      <div className="flex-1">
        <Input name="name" aria-label="ชื่องาน" placeholder="เพิ่มงานใหม่…" />
        {state.error && <Alert variant="error" className="mt-2">{state.error}</Alert>}
      </div>
      <Button type="submit" variant="secondary" disabled={pending}>เพิ่มงาน</Button>
    </form>
  );
}
