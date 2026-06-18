"use client";

import { useActionState } from "react";

import type { Product } from "@/src/domain/entities";
import { formatScaled } from "@/src/domain/services/money";
import type { FormState } from "@/src/presentation/actions/product-actions";
import { FormField } from "@/src/presentation/components/ui/FormField";
import { Input } from "@/src/presentation/components/ui/Input";
import { Select } from "@/src/presentation/components/ui/Select";
import { Button } from "@/src/presentation/components/ui/Button";
import { Alert } from "@/src/presentation/components/ui/Alert";

type ProductAction = (prev: FormState, formData: FormData) => Promise<FormState>;

export function ProductForm({
  action,
  product,
  submitLabel,
}: {
  action: ProductAction;
  product?: Product;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error && <Alert variant="error">{state.error}</Alert>}
      {product && <input type="hidden" name="id" value={product.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="รหัสสินค้า (SKU)" required>
          <Input name="sku" defaultValue={product?.sku} placeholder="เช่น P-001" />
        </FormField>
        <FormField label="ชื่อสินค้า" required>
          <Input name="name" defaultValue={product?.name} />
        </FormField>
        <FormField label="ประเภท" required>
          <Select name="type" defaultValue={product?.type ?? "stockable"}>
            <option value="stockable">นับสต๊อก</option>
            <option value="consumable">สิ้นเปลือง</option>
            <option value="service">บริการ</option>
          </Select>
        </FormField>
        <FormField label="หน่วยนับ">
          <Input name="uom" defaultValue={product?.uom ?? "หน่วย"} />
        </FormField>
        <FormField label="ราคาขาย (บาท)">
          <Input
            name="salePrice"
            inputMode="decimal"
            defaultValue={product ? formatScaled(product.salePrice, 100) : "0"}
          />
        </FormField>
        <FormField label="ราคาทุน (บาท)">
          <Input
            name="costPrice"
            inputMode="decimal"
            defaultValue={product ? formatScaled(product.costPrice, 100) : "0"}
          />
        </FormField>
        <FormField label="ภาษี (%)">
          <Input
            name="taxRate"
            inputMode="decimal"
            defaultValue={product ? formatScaled(product.taxRateBp, 100) : "0"}
          />
        </FormField>
      </div>

      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "กำลังบันทึก…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
