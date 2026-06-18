"use client";

import { useActionState } from "react";

import { openSessionAction, type FormState } from "@/src/presentation/actions/pos-actions";
import { FormField } from "@/src/presentation/components/ui/FormField";
import { Input } from "@/src/presentation/components/ui/Input";
import { Button } from "@/src/presentation/components/ui/Button";
import { Alert } from "@/src/presentation/components/ui/Alert";

export function OpenSessionForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(openSessionAction, {});
  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error && <Alert variant="error">{state.error}</Alert>}
      <FormField label="เงินสดตั้งต้น (บาท)">
        <Input name="openingCash" inputMode="decimal" placeholder="0" defaultValue="0" />
      </FormField>
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "กำลังเปิดกะ…" : "เปิดกะ"}
        </Button>
      </div>
    </form>
  );
}
