"use client";

import { useActionState } from "react";

import { closeSessionAction, type FormState } from "@/src/presentation/actions/pos-actions";
import { FormField } from "@/src/presentation/components/ui/FormField";
import { Input } from "@/src/presentation/components/ui/Input";
import { Button } from "@/src/presentation/components/ui/Button";
import { Alert } from "@/src/presentation/components/ui/Alert";

export function CloseSessionForm({ sessionId }: { sessionId: string }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(closeSessionAction, {});
  return (
    <form action={formAction} className="flex items-end gap-3">
      {state.error && <Alert variant="error">{state.error}</Alert>}
      <input type="hidden" name="sessionId" value={sessionId} />
      <div className="flex-1">
        <FormField label="เงินสดนับได้จริง (บาท)">
          <Input name="countedCash" inputMode="decimal" placeholder="0" defaultValue="0" />
        </FormField>
      </div>
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "กำลังปิดกะ…" : "ปิดกะ"}
      </Button>
    </form>
  );
}
