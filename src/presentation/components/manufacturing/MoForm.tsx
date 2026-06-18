"use client";

import { useActionState } from "react";

import { createMoAction, type FormState } from "@/src/presentation/actions/manufacturing-actions";
import { FormField } from "@/src/presentation/components/ui/FormField";
import { Select } from "@/src/presentation/components/ui/Select";
import { Input } from "@/src/presentation/components/ui/Input";
import { Button } from "@/src/presentation/components/ui/Button";
import { Alert } from "@/src/presentation/components/ui/Alert";

export interface BomOption {
  id: string;
  name: string;
}

export function MoForm({ boms }: { boms: BomOption[] }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(createMoAction, {});
  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error && <Alert variant="error">{state.error}</Alert>}

      <FormField label="สูตรการผลิต" required>
        <Select name="bomId" defaultValue="" aria-label="สูตรการผลิต">
          <option value="" disabled>— เลือกสูตร —</option>
          {boms.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </Select>
      </FormField>

      <FormField label="จำนวนที่จะผลิต" required>
        <Input name="qty" inputMode="decimal" placeholder="1" defaultValue="1" />
      </FormField>

      <div>
        <Button type="submit" disabled={pending || boms.length === 0}>
          {pending ? "กำลังบันทึก…" : "สร้างใบสั่งผลิต"}
        </Button>
      </div>
    </form>
  );
}
