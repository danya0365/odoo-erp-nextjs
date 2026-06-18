"use client";

import { useActionState } from "react";

import { postPayrollRunAction, type FormState } from "@/src/presentation/actions/hr-actions";
import { Button } from "@/src/presentation/components/ui/Button";
import { Alert } from "@/src/presentation/components/ui/Alert";

export function PostPayrollButton({ runId }: { runId: string }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(postPayrollRunAction, {});
  return (
    <form action={formAction} className="space-y-2">
      {state.error && <Alert variant="error">{state.error}</Alert>}
      <input type="hidden" name="id" value={runId} />
      <Button type="submit" disabled={pending}>
        {pending ? "กำลังอนุมัติ…" : "อนุมัติจ่ายเงินเดือน (ลงบัญชี)"}
      </Button>
    </form>
  );
}
