"use client";

import { useActionState, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { parseScaled, formatScaled } from "@/src/domain/services/money";
import {
  createManualEntryAction,
  type FormState,
} from "@/src/presentation/actions/accounting-actions";
import { FormField } from "@/src/presentation/components/ui/FormField";
import { Select } from "@/src/presentation/components/ui/Select";
import { Input } from "@/src/presentation/components/ui/Input";
import { Button } from "@/src/presentation/components/ui/Button";
import { Alert } from "@/src/presentation/components/ui/Alert";
import { Table, THead, TBody, Tr, Th, Td } from "@/src/presentation/components/ui/Table";

export interface AccountOption {
  id: string;
  code: string;
  name: string;
}

interface Row {
  key: number;
  accountId: string;
  label: string;
  debit: string;
  credit: string;
}

const money = (s: string) => (/^\d+(\.\d+)?$/.test(s) ? parseScaled(s, 100) : 0);

export function ManualEntryForm({ accounts }: { accounts: AccountOption[] }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    createManualEntryAction,
    {},
  );
  const [rows, setRows] = useState<Row[]>([
    { key: 1, accountId: "", label: "", debit: "", credit: "" },
    { key: 2, accountId: "", label: "", debit: "", credit: "" },
  ]);

  const addRow = () =>
    setRows((r) => [
      ...r,
      { key: Math.max(0, ...r.map((x) => x.key)) + 1, accountId: "", label: "", debit: "", credit: "" },
    ]);
  const removeRow = (key: number) =>
    setRows((r) => (r.length > 2 ? r.filter((x) => x.key !== key) : r));
  const patchRow = (key: number, patch: Partial<Row>) =>
    setRows((r) => r.map((x) => (x.key === key ? { ...x, ...patch } : x)));

  const totalDebit = rows.reduce((s, r) => s + money(r.debit), 0);
  const totalCredit = rows.reduce((s, r) => s + money(r.credit), 0);
  const balanced = totalDebit === totalCredit && totalDebit > 0;

  const validRows = rows.filter((r) => r.accountId && (money(r.debit) > 0 || money(r.credit) > 0));
  const linesJson = JSON.stringify(
    validRows.map((r) => ({ accountId: r.accountId, label: r.label, debit: r.debit, credit: r.credit })),
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error && <Alert variant="error">{state.error}</Alert>}
      <input type="hidden" name="lines" value={linesJson} />

      <Table>
        <THead>
          <Tr>
            <Th>บัญชี</Th>
            <Th>คำอธิบาย</Th>
            <Th>เดบิต</Th>
            <Th>เครดิต</Th>
            <Th></Th>
          </Tr>
        </THead>
        <TBody>
          {rows.map((row) => (
            <Tr key={row.key}>
              <Td>
                <Select
                  aria-label="บัญชี"
                  value={row.accountId}
                  onChange={(e) => patchRow(row.key, { accountId: e.target.value })}
                >
                  <option value="" disabled>
                    — เลือกบัญชี —
                  </option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.code} · {a.name}
                    </option>
                  ))}
                </Select>
              </Td>
              <Td>
                <Input
                  aria-label="คำอธิบาย"
                  value={row.label}
                  onChange={(e) => patchRow(row.key, { label: e.target.value })}
                />
              </Td>
              <Td className="w-32">
                <Input
                  aria-label="เดบิต"
                  inputMode="decimal"
                  value={row.debit}
                  onChange={(e) => patchRow(row.key, { debit: e.target.value, credit: "" })}
                />
              </Td>
              <Td className="w-32">
                <Input
                  aria-label="เครดิต"
                  inputMode="decimal"
                  value={row.credit}
                  onChange={(e) => patchRow(row.key, { credit: e.target.value, debit: "" })}
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
          เพิ่มบรรทัด
        </Button>
        <div className="text-right text-sm">
          <p className="text-muted">
            เดบิต ฿{formatScaled(totalDebit, 100)} · เครดิต ฿{formatScaled(totalCredit, 100)}
          </p>
          <p className={balanced ? "font-semibold text-emerald-600" : "font-semibold text-red-600"}>
            {balanced ? "สมดุล ✓" : `ต่างกัน ฿${formatScaled(Math.abs(totalDebit - totalCredit), 100)}`}
          </p>
        </div>
      </div>

      <FormField label="อ้างอิง">
        <Input name="ref" placeholder="(ไม่บังคับ)" />
      </FormField>

      <div>
        <Button type="submit" disabled={pending || !balanced}>
          {pending ? "กำลังบันทึก…" : "บันทึกรายการบัญชี"}
        </Button>
      </div>
    </form>
  );
}
