"use client";

import { useActionState } from "react";

import { receiveLotAction, allocateFefoAction, type FormState } from "@/src/presentation/actions/lot-actions";
import { FormField } from "@/src/presentation/components/ui/FormField";
import { Input } from "@/src/presentation/components/ui/Input";
import { Select } from "@/src/presentation/components/ui/Select";
import { Button } from "@/src/presentation/components/ui/Button";
import { Alert } from "@/src/presentation/components/ui/Alert";

export interface ProductOption {
  id: string;
  name: string;
}

export function ReceiveLotForm({ products }: { products: ProductOption[] }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(receiveLotAction, {});
  return (
    <form action={formAction} className="space-y-3">
      {state.error && <Alert variant="error">{state.error}</Alert>}
      {state.success && <Alert variant="success">{state.success}</Alert>}
      <FormField label="สินค้า" required>
        <Select name="productId" aria-label="สินค้ารับเข้าล็อต">
          <option value="">— เลือกสินค้า —</option>
          {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </Select>
      </FormField>
      <div className="grid gap-3 sm:grid-cols-3">
        <FormField label="เลขล็อต">
          <Input name="lotNumber" placeholder="LOT-001" aria-label="เลขล็อต" />
        </FormField>
        <FormField label="วันหมดอายุ" required>
          <Input name="expiryDate" type="date" aria-label="วันหมดอายุ" />
        </FormField>
        <FormField label="จำนวน" required>
          <Input name="qty" inputMode="decimal" placeholder="10" aria-label="จำนวนรับเข้า" />
        </FormField>
      </div>
      <Button type="submit" disabled={pending}>{pending ? "กำลังรับเข้า…" : "รับเข้าล็อต"}</Button>
    </form>
  );
}

export function FefoForm({ products }: { products: ProductOption[] }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(allocateFefoAction, {});
  return (
    <form action={formAction} className="space-y-3">
      {state.error && <Alert variant="error">{state.error}</Alert>}
      {state.success && <Alert variant="success">{state.success}</Alert>}
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField label="สินค้า" required>
          <Select name="productId" aria-label="สินค้าตัด FEFO">
            <option value="">— เลือกสินค้า —</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
        </FormField>
        <FormField label="จำนวนที่ตัด" required>
          <Input name="qty" inputMode="decimal" placeholder="5" aria-label="จำนวนตัด FEFO" />
        </FormField>
      </div>
      <Button type="submit" variant="secondary" disabled={pending}>{pending ? "กำลังตัด…" : "ตัดสต๊อก (FEFO)"}</Button>
    </form>
  );
}
