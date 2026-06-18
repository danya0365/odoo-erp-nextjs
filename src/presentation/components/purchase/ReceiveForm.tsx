"use client";

import { useActionState } from "react";

import { formatScaled, QTY_SCALE } from "@/src/domain/services/money";
import {
  receivePurchaseOrderAction,
  type FormState,
} from "@/src/presentation/actions/purchase-actions";
import { Button } from "@/src/presentation/components/ui/Button";
import { Alert } from "@/src/presentation/components/ui/Alert";
import { Input } from "@/src/presentation/components/ui/Input";
import { Table, THead, TBody, Tr, Th, Td } from "@/src/presentation/components/ui/Table";

export interface ReceiveLineView {
  id: string;
  productName: string;
  remaining: number;
  uom: string;
}

export function ReceiveForm({ orderId, lines }: { orderId: string; lines: ReceiveLineView[] }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    receivePurchaseOrderAction,
    {},
  );
  const pendingLines = lines.filter((l) => l.remaining > 0);
  if (pendingLines.length === 0) return null;

  return (
    <form action={formAction} className="flex flex-col gap-3">
      {state.error && <Alert variant="error">{state.error}</Alert>}
      {state.success && <Alert variant="success">{state.success}</Alert>}
      <input type="hidden" name="id" value={orderId} />
      <Table>
        <THead>
          <Tr>
            <Th>สินค้า</Th>
            <Th>คงค้าง</Th>
            <Th>รับครั้งนี้</Th>
          </Tr>
        </THead>
        <TBody>
          {pendingLines.map((l) => (
            <Tr key={l.id}>
              <Td>{l.productName}</Td>
              <Td>
                {formatScaled(l.remaining, QTY_SCALE)} {l.uom}
              </Td>
              <Td className="w-32">
                <Input
                  name={`qty_${l.id}`}
                  inputMode="decimal"
                  defaultValue={formatScaled(l.remaining, QTY_SCALE)}
                />
              </Td>
            </Tr>
          ))}
        </TBody>
      </Table>
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "กำลังบันทึก…" : "บันทึกการรับของ"}
        </Button>
      </div>
    </form>
  );
}
