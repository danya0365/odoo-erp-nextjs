"use client";

import { useActionState } from "react";

import {
  createLocationAction,
  type FormState,
} from "@/src/presentation/actions/inventory-actions";
import { FormField } from "@/src/presentation/components/ui/FormField";
import { Input } from "@/src/presentation/components/ui/Input";
import { Button } from "@/src/presentation/components/ui/Button";
import { Alert } from "@/src/presentation/components/ui/Alert";

export function LocationForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    createLocationAction,
    {},
  );
  return (
    <form action={formAction} className="flex items-end gap-3">
      {state.error && <Alert variant="error">{state.error}</Alert>}
      <div className="flex-1">
        <FormField label="ชื่อคลังใหม่">
          <Input name="name" placeholder="เช่น คลังสาขา 2" />
        </FormField>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "กำลังบันทึก…" : "เพิ่มคลัง"}
      </Button>
    </form>
  );
}
