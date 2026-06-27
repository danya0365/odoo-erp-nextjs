"use client";

import { useActionState } from "react";

import {
  createPromotionAction,
  applyPromotionAction,
  earnPointsAction,
  redeemPointsAction,
  type FormState,
} from "@/src/presentation/actions/marketing-actions";
import { FormField } from "@/src/presentation/components/ui/FormField";
import { Input } from "@/src/presentation/components/ui/Input";
import { Select } from "@/src/presentation/components/ui/Select";
import { Button } from "@/src/presentation/components/ui/Button";
import { Alert } from "@/src/presentation/components/ui/Alert";

export interface Option {
  id: string;
  name: string;
}

export function PromotionForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(createPromotionAction, {});
  return (
    <form action={formAction} className="space-y-3">
      {state.error && <Alert variant="error">{state.error}</Alert>}
      {state.success && <Alert variant="success">{state.success}</Alert>}
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField label="โค้ด" required>
          <Input name="code" placeholder="เช่น SAVE10" aria-label="โค้ดโปรโมชั่น" />
        </FormField>
        <FormField label="ประเภท" required>
          <Select name="discountType" defaultValue="percent" aria-label="ประเภทส่วนลด">
            <option value="percent">ส่วนลด %</option>
            <option value="fixed">ลดเป็นจำนวนเงิน</option>
          </Select>
        </FormField>
        <FormField label="ค่าส่วนลด (% หรือ บาท)" required>
          <Input name="value" inputMode="decimal" placeholder="10" aria-label="ค่าส่วนลด" />
        </FormField>
        <FormField label="ยอดซื้อขั้นต่ำ (บาท)">
          <Input name="minSpend" inputMode="decimal" placeholder="0" aria-label="ยอดขั้นต่ำ" />
        </FormField>
      </div>
      <FormField label="คำอธิบาย">
        <Input name="description" />
      </FormField>
      <Button type="submit" disabled={pending}>{pending ? "กำลังสร้าง…" : "สร้างโปรโมชั่น"}</Button>
    </form>
  );
}

export function ApplyForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(applyPromotionAction, {});
  return (
    <form action={formAction} className="space-y-3">
      {state.error && <Alert variant="error">{state.error}</Alert>}
      {state.success && <Alert variant="success">{state.success}</Alert>}
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField label="โค้ด" required>
          <Input name="code" placeholder="SAVE10" aria-label="โค้ดที่จะใช้" />
        </FormField>
        <FormField label="ยอดซื้อ (บาท)" required>
          <Input name="amount" inputMode="decimal" placeholder="1000" aria-label="ยอดซื้อ" />
        </FormField>
      </div>
      <Button type="submit" variant="secondary" disabled={pending}>{pending ? "กำลังคำนวณ…" : "คำนวณส่วนลด"}</Button>
    </form>
  );
}

export function EarnForm({ customers }: { customers: Option[] }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(earnPointsAction, {});
  return (
    <form action={formAction} className="space-y-3">
      {state.error && <Alert variant="error">{state.error}</Alert>}
      {state.success && <Alert variant="success">{state.success}</Alert>}
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField label="ลูกค้า" required>
          <Select name="customerId" aria-label="ลูกค้าสะสมแต้ม">
            <option value="">— เลือกลูกค้า —</option>
            {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </FormField>
        <FormField label="ยอดซื้อ (บาท)" required>
          <Input name="amount" inputMode="decimal" placeholder="500" aria-label="ยอดซื้อสะสมแต้ม" />
        </FormField>
      </div>
      <Button type="submit" disabled={pending}>{pending ? "กำลังสะสม…" : "สะสมแต้ม"}</Button>
    </form>
  );
}

export function RedeemForm({ customers }: { customers: Option[] }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(redeemPointsAction, {});
  return (
    <form action={formAction} className="space-y-3">
      {state.error && <Alert variant="error">{state.error}</Alert>}
      {state.success && <Alert variant="success">{state.success}</Alert>}
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField label="ลูกค้า" required>
          <Select name="customerId" aria-label="ลูกค้าแลกแต้ม">
            <option value="">— เลือกลูกค้า —</option>
            {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </FormField>
        <FormField label="แต้มที่แลก" required>
          <Input name="points" type="number" inputMode="numeric" placeholder="10" aria-label="แต้มที่แลก" />
        </FormField>
      </div>
      <Button type="submit" variant="secondary" disabled={pending}>{pending ? "กำลังแลก…" : "แลกแต้ม"}</Button>
    </form>
  );
}
