"use client";

import { useActionState, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { computeLine, parseScaled, formatScaled, QTY_SCALE } from "@/src/domain/services/money";
import {
  createQuotationAction,
  type FormState,
} from "@/src/presentation/actions/sales-actions";
import { FormField } from "@/src/presentation/components/ui/FormField";
import { Select } from "@/src/presentation/components/ui/Select";
import { Input } from "@/src/presentation/components/ui/Input";
import { Button } from "@/src/presentation/components/ui/Button";
import { Alert } from "@/src/presentation/components/ui/Alert";
import { Table, THead, TBody, Tr, Th, Td } from "@/src/presentation/components/ui/Table";

export interface CustomerOption {
  id: string;
  name: string;
}
export interface ProductOption {
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

export function QuotationForm({
  customers,
  products,
}: {
  customers: CustomerOption[];
  products: ProductOption[];
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    createQuotationAction,
    {},
  );
  const [rows, setRows] = useState<Row[]>([{ key: 1, productId: "", qty: "1" }]);

  const productMap = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  function addRow() {
    setRows((r) => [...r, { key: Math.max(0, ...r.map((x) => x.key)) + 1, productId: "", qty: "1" }]);
  }
  function removeRow(key: number) {
    setRows((r) => (r.length > 1 ? r.filter((x) => x.key !== key) : r));
  }
  function patchRow(key: number, patch: Partial<Row>) {
    setRows((r) => r.map((x) => (x.key === key ? { ...x, ...patch } : x)));
  }

  const validRows = rows.filter((r) => r.productId && /^\d+(\.\d+)?$/.test(r.qty));
  const total = validRows.reduce((sum, r) => {
    const p = productMap.get(r.productId);
    if (!p) return sum;
    const t = computeLine(parseScaled(r.qty || "0", QTY_SCALE), p.salePrice, p.taxRateBp);
    return sum + t.total;
  }, 0);

  const linesJson = JSON.stringify(validRows.map((r) => ({ productId: r.productId, qty: r.qty })));

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error && <Alert variant="error">{state.error}</Alert>}
      <input type="hidden" name="lines" value={linesJson} />

      <FormField label="ลูกค้า" required>
        <Select name="customerId" defaultValue="">
          <option value="" disabled>
            — เลือกลูกค้า —
          </option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </FormField>

      <Table>
        <THead>
          <Tr>
            <Th>สินค้า</Th>
            <Th>จำนวน</Th>
            <Th>ราคา/หน่วย</Th>
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
                    <option value="" disabled>
                      — เลือกสินค้า —
                    </option>
                    {products.map((pr) => (
                      <option key={pr.id} value={pr.id}>
                        {pr.name}
                      </option>
                    ))}
                  </Select>
                </Td>
                <Td className="w-28">
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
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRow(row.key)}
                  >
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
        <p className="text-lg font-semibold">รวมทั้งสิ้น ฿{formatScaled(total, 100)}</p>
      </div>

      <FormField label="หมายเหตุ">
        <Input name="note" placeholder="(ไม่บังคับ)" />
      </FormField>

      <div>
        <Button type="submit" disabled={pending || validRows.length === 0}>
          {pending ? "กำลังบันทึก…" : "บันทึกใบเสนอราคา"}
        </Button>
      </div>
    </form>
  );
}
