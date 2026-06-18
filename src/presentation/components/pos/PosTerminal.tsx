"use client";

import { useActionState, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { computeLine, parseScaled, formatScaled, QTY_SCALE } from "@/src/domain/services/money";
import { checkoutAction, type FormState } from "@/src/presentation/actions/pos-actions";
import { FormField } from "@/src/presentation/components/ui/FormField";
import { Select } from "@/src/presentation/components/ui/Select";
import { Input } from "@/src/presentation/components/ui/Input";
import { Button } from "@/src/presentation/components/ui/Button";
import { Alert } from "@/src/presentation/components/ui/Alert";
import { Table, THead, TBody, Tr, Th, Td } from "@/src/presentation/components/ui/Table";

export interface PosProduct {
  id: string;
  name: string;
  salePrice: number;
  taxRateBp: number;
}

interface Row {
  key: number;
  productId: string;
  qty: string;
}

export function PosTerminal({
  sessionId,
  products,
}: {
  sessionId: string;
  products: PosProduct[];
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(checkoutAction, {});
  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error && <Alert variant="error">{state.error}</Alert>}
      {state.success && <Alert variant="success">{state.success}</Alert>}
      <input type="hidden" name="sessionId" value={sessionId} />
      {/* key เปลี่ยนทุกครั้งที่ขายสำเร็จ → remount เพื่อรีเซ็ตตะกร้า (เลี่ยง setState ใน effect) */}
      <Cart key={state.success ?? "init"} products={products} pending={pending} />
    </form>
  );
}

function Cart({
  products,
  pending,
}: {
  products: PosProduct[];
  pending: boolean;
}) {
  const [rows, setRows] = useState<Row[]>([{ key: 1, productId: "", qty: "1" }]);
  const productMap = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  const addRow = () =>
    setRows((r) => [...r, { key: Math.max(0, ...r.map((x) => x.key)) + 1, productId: "", qty: "1" }]);
  const removeRow = (key: number) =>
    setRows((r) => (r.length > 1 ? r.filter((x) => x.key !== key) : r));
  const patchRow = (key: number, patch: Partial<Row>) =>
    setRows((r) => r.map((x) => (x.key === key ? { ...x, ...patch } : x)));

  const validRows = rows.filter((r) => r.productId && /^\d+(\.\d+)?$/.test(r.qty));
  const total = validRows.reduce((sum, r) => {
    const p = productMap.get(r.productId);
    if (!p) return sum;
    return sum + computeLine(parseScaled(r.qty || "0", QTY_SCALE), p.salePrice, p.taxRateBp).total;
  }, 0);
  const linesJson = JSON.stringify(validRows.map((r) => ({ productId: r.productId, qty: r.qty })));

  return (
    <>
      <input type="hidden" name="lines" value={linesJson} />

      <Table>
        <THead>
          <Tr>
            <Th>สินค้า</Th>
            <Th>จำนวน</Th>
            <Th>ราคา</Th>
            <Th>รวม</Th>
            <Th></Th>
          </Tr>
        </THead>
        <TBody>
          {rows.map((row) => {
            const p = productMap.get(row.productId);
            const lineTotal = p
              ? computeLine(parseScaled(row.qty || "0", QTY_SCALE), p.salePrice, p.taxRateBp).total
              : 0;
            return (
              <Tr key={row.key}>
                <Td>
                  <Select
                    aria-label="สินค้า"
                    value={row.productId}
                    onChange={(e) => patchRow(row.key, { productId: e.target.value })}
                  >
                    <option value="" disabled>— เลือกสินค้า —</option>
                    {products.map((pr) => (
                      <option key={pr.id} value={pr.id}>{pr.name}</option>
                    ))}
                  </Select>
                </Td>
                <Td className="w-24">
                  <Input
                    aria-label="จำนวน"
                    inputMode="decimal"
                    value={row.qty}
                    onChange={(e) => patchRow(row.key, { qty: e.target.value })}
                  />
                </Td>
                <Td>{p ? `฿${formatScaled(p.salePrice, 100)}` : "—"}</Td>
                <Td>฿{formatScaled(lineTotal, 100)}</Td>
                <Td>
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeRow(row.key)}>
                    <Trash2 className="size-4" />
                  </Button>
                </Td>
              </Tr>
            );
          })}
        </TBody>
      </Table>

      <div className="flex items-center justify-between">
        <Button type="button" variant="secondary" size="sm" onClick={addRow}>
          <Plus className="size-4" />
          เพิ่มรายการ
        </Button>
        <p className="text-xl font-bold">รวม ฿{formatScaled(total, 100)}</p>
      </div>

      <div className="flex items-end gap-3">
        <div className="w-48">
          <FormField label="วิธีชำระ">
            <Select name="paymentMethod" defaultValue="cash">
              <option value="cash">เงินสด</option>
              <option value="transfer">โอน</option>
            </Select>
          </FormField>
        </div>
        <Button type="submit" disabled={pending || validRows.length === 0}>
          {pending ? "กำลังบันทึก…" : "ชำระเงิน"}
        </Button>
      </div>
    </>
  );
}
