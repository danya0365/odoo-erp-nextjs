"use client";

import { useActionState } from "react";

import {
  transferStockAction,
  type FormState,
} from "@/src/presentation/actions/inventory-actions";
import { FormField } from "@/src/presentation/components/ui/FormField";
import { Select } from "@/src/presentation/components/ui/Select";
import { Input } from "@/src/presentation/components/ui/Input";
import { Button } from "@/src/presentation/components/ui/Button";
import { Alert } from "@/src/presentation/components/ui/Alert";

export interface Option {
  id: string;
  name: string;
}

export function TransferForm({
  products,
  locations,
}: {
  products: Option[];
  locations: Option[];
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    transferStockAction,
    {},
  );
  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error && <Alert variant="error">{state.error}</Alert>}
      {state.success && <Alert variant="success">{state.success}</Alert>}

      <FormField label="สินค้า" required>
        <Select name="productId" defaultValue="" aria-label="สินค้า">
          <option value="" disabled>— เลือกสินค้า —</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </Select>
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="จากคลัง" required>
          <Select name="fromLocationId" defaultValue="" aria-label="จากคลัง">
            <option value="" disabled>— ต้นทาง —</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </Select>
        </FormField>
        <FormField label="ไปคลัง" required>
          <Select name="toLocationId" defaultValue="" aria-label="ไปคลัง">
            <option value="" disabled>— ปลายทาง —</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </Select>
        </FormField>
      </div>

      <FormField label="จำนวน" required>
        <Input name="qty" inputMode="decimal" placeholder="0" />
      </FormField>

      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "กำลังโอน…" : "โอนสต๊อก"}
        </Button>
      </div>
    </form>
  );
}
