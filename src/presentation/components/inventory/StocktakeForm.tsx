"use client";

import { useActionState } from "react";

import { applyStockCountAction, type FormState } from "@/src/presentation/actions/stocktake-actions";
import { formatScaled } from "@/src/domain/services/money";
import { Button } from "@/src/presentation/components/ui/Button";
import { Input } from "@/src/presentation/components/ui/Input";
import { Alert } from "@/src/presentation/components/ui/Alert";
import { Table, THead, TBody, Tr, Th, Td } from "@/src/presentation/components/ui/Table";

export interface StocktakeFormLine {
  id: string;
  name: string;
  systemQty: number;
  countedQty: number;
}

export function StocktakeForm({ id, lines }: { id: string; lines: StocktakeFormLine[] }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(applyStockCountAction, {});
  return (
    <form action={formAction} className="space-y-4">
      {state.error && <Alert variant="error">{state.error}</Alert>}
      <input type="hidden" name="id" value={id} />
      <Table>
        <THead>
          <Tr>
            <Th>สินค้า</Th>
            <Th>ยอดระบบ</Th>
            <Th>นับได้จริง</Th>
          </Tr>
        </THead>
        <TBody>
          {lines.map((l) => (
            <Tr key={l.id}>
              <Td>{l.name}</Td>
              <Td className="text-muted">{formatScaled(l.systemQty, 1000)}</Td>
              <Td className="w-32">
                <Input
                  name={`cnt_${l.id}`}
                  defaultValue={formatScaled(l.countedQty, 1000)}
                  inputMode="decimal"
                  aria-label={`นับได้จริง ${l.name}`}
                />
              </Td>
            </Tr>
          ))}
        </TBody>
      </Table>
      <Button type="submit" disabled={pending}>
        {pending ? "กำลังปรับ…" : "ยืนยันปรับสต๊อกตามผลนับ"}
      </Button>
    </form>
  );
}
