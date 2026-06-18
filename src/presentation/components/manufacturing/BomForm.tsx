"use client";

import { useActionState, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { createBomAction, type FormState } from "@/src/presentation/actions/manufacturing-actions";
import { FormField } from "@/src/presentation/components/ui/FormField";
import { Select } from "@/src/presentation/components/ui/Select";
import { Input } from "@/src/presentation/components/ui/Input";
import { Button } from "@/src/presentation/components/ui/Button";
import { Alert } from "@/src/presentation/components/ui/Alert";
import { Table, THead, TBody, Tr, Th, Td } from "@/src/presentation/components/ui/Table";

export interface ProductOption {
  id: string;
  name: string;
}

interface Row {
  key: number;
  componentId: string;
  qtyPerUnit: string;
}

export function BomForm({ products }: { products: ProductOption[] }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(createBomAction, {});
  const [rows, setRows] = useState<Row[]>([{ key: 1, componentId: "", qtyPerUnit: "1" }]);

  const addRow = () =>
    setRows((r) => [...r, { key: Math.max(0, ...r.map((x) => x.key)) + 1, componentId: "", qtyPerUnit: "1" }]);
  const removeRow = (key: number) =>
    setRows((r) => (r.length > 1 ? r.filter((x) => x.key !== key) : r));
  const patchRow = (key: number, patch: Partial<Row>) =>
    setRows((r) => r.map((x) => (x.key === key ? { ...x, ...patch } : x)));

  const validRows = rows.filter((r) => r.componentId && /^\d+(\.\d+)?$/.test(r.qtyPerUnit));
  const linesJson = JSON.stringify(
    validRows.map((r) => ({ componentId: r.componentId, qtyPerUnit: r.qtyPerUnit })),
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error && <Alert variant="error">{state.error}</Alert>}
      <input type="hidden" name="lines" value={linesJson} />

      <FormField label="ชื่อสูตร" required>
        <Input name="name" placeholder="เช่น สูตรกาแฟเย็น" />
      </FormField>

      <FormField label="สินค้าสำเร็จรูป" required>
        <Select name="productId" defaultValue="" aria-label="สินค้าสำเร็จรูป">
          <option value="" disabled>— เลือกสินค้าสำเร็จรูป —</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </Select>
      </FormField>

      <Table>
        <THead>
          <Tr>
            <Th>วัตถุดิบ</Th>
            <Th>ใช้ต่อหน่วย</Th>
            <Th></Th>
          </Tr>
        </THead>
        <TBody>
          {rows.map((row) => (
            <Tr key={row.key}>
              <Td>
                <Select
                  aria-label="วัตถุดิบ"
                  value={row.componentId}
                  onChange={(e) => patchRow(row.key, { componentId: e.target.value })}
                >
                  <option value="" disabled>— เลือกวัตถุดิบ —</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </Select>
              </Td>
              <Td className="w-28">
                <Input
                  aria-label="ใช้ต่อหน่วย"
                  inputMode="decimal"
                  value={row.qtyPerUnit}
                  onChange={(e) => patchRow(row.key, { qtyPerUnit: e.target.value })}
                />
              </Td>
              <Td>
                <Button type="button" variant="ghost" size="sm" onClick={() => removeRow(row.key)}>
                  <Trash2 className="size-4" />
                </Button>
              </Td>
            </Tr>
          ))}
        </TBody>
      </Table>

      <div className="flex items-center justify-between">
        <Button type="button" variant="secondary" size="sm" onClick={addRow}>
          <Plus className="size-4" />
          เพิ่มวัตถุดิบ
        </Button>
        <Button type="submit" disabled={pending || validRows.length === 0}>
          {pending ? "กำลังบันทึก…" : "บันทึกสูตร"}
        </Button>
      </div>
    </form>
  );
}
