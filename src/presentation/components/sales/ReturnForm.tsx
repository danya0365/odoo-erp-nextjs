"use client";

import { useActionState } from "react";

import { createSalesReturnAction, type FormState } from "@/src/presentation/actions/sales-return-actions";
import { formatScaled } from "@/src/domain/services/money";
import { FormField } from "@/src/presentation/components/ui/FormField";
import { Input } from "@/src/presentation/components/ui/Input";
import { Textarea } from "@/src/presentation/components/ui/Textarea";
import { Button } from "@/src/presentation/components/ui/Button";
import { Alert } from "@/src/presentation/components/ui/Alert";
import { Table, THead, TBody, Tr, Th, Td } from "@/src/presentation/components/ui/Table";

export interface ReturnFormLine {
  id: string;
  name: string;
  qty: number; // scale QTY_SCALE (max returnable)
  unitPrice: number;
}

export function ReturnForm({ invoiceId, lines }: { invoiceId: string; lines: ReturnFormLine[] }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(createSalesReturnAction, {});
  return (
    <form action={formAction} className="space-y-4">
      {state.error && <Alert variant="error">{state.error}</Alert>}
      <input type="hidden" name="invoiceId" value={invoiceId} />

      <Table>
        <THead>
          <Tr>
            <Th>สินค้า</Th>
            <Th>ราคา/หน่วย</Th>
            <Th>จำนวนในบิล</Th>
            <Th>จำนวนที่คืน</Th>
          </Tr>
        </THead>
        <TBody>
          {lines.map((l) => (
            <Tr key={l.id}>
              <Td>{l.name}</Td>
              <Td>฿{formatScaled(l.unitPrice, 100)}</Td>
              <Td>{formatScaled(l.qty, 1000)}</Td>
              <Td className="w-32">
                <Input
                  name={`qty_${l.id}`}
                  defaultValue="0"
                  inputMode="decimal"
                  aria-label={`จำนวนที่คืน ${l.name}`}
                />
              </Td>
            </Tr>
          ))}
        </TBody>
      </Table>

      <FormField label="เหตุผลการคืน">
        <Textarea name="reason" rows={2} placeholder="เช่น สินค้าชำรุด / ลูกค้าเปลี่ยนใจ…" />
      </FormField>

      <Button type="submit" disabled={pending}>
        {pending ? "กำลังสร้าง…" : "สร้างใบคืนสินค้า"}
      </Button>
    </form>
  );
}
