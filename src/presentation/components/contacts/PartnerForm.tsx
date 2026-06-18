"use client";

import { useActionState } from "react";

import type { Partner } from "@/src/domain/entities";
import type { FormState } from "@/src/presentation/actions/partner-actions";
import { FormField } from "@/src/presentation/components/ui/FormField";
import { Input } from "@/src/presentation/components/ui/Input";
import { Select } from "@/src/presentation/components/ui/Select";
import { Button } from "@/src/presentation/components/ui/Button";
import { Alert } from "@/src/presentation/components/ui/Alert";
import { Checkbox } from "@/src/presentation/components/ui/Checkbox";

type PartnerAction = (prev: FormState, formData: FormData) => Promise<FormState>;

export function PartnerForm({
  action,
  partner,
  submitLabel,
}: {
  action: PartnerAction;
  partner?: Partner;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error && <Alert variant="error">{state.error}</Alert>}
      {partner && <input type="hidden" name="id" value={partner.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="ชื่อ" required>
          <Input name="name" defaultValue={partner?.name} placeholder="ชื่อผู้ติดต่อ/บริษัท" />
        </FormField>
        <FormField label="ประเภท" required>
          <Select name="type" defaultValue={partner?.type ?? "customer"}>
            <option value="customer">ลูกค้า</option>
            <option value="vendor">ผู้ขาย</option>
            <option value="both">ทั้งคู่</option>
          </Select>
        </FormField>
        <FormField label="อีเมล">
          <Input name="email" type="email" defaultValue={partner?.email ?? ""} />
        </FormField>
        <FormField label="โทรศัพท์">
          <Input name="phone" defaultValue={partner?.phone ?? ""} />
        </FormField>
        <FormField label="เลขผู้เสียภาษี">
          <Input name="taxId" defaultValue={partner?.taxId ?? ""} />
        </FormField>
        <FormField label="ที่อยู่">
          <Input name="street" defaultValue={partner?.street ?? ""} />
        </FormField>
        <FormField label="เมือง/จังหวัด">
          <Input name="city" defaultValue={partner?.city ?? ""} />
        </FormField>
        <FormField label="ประเทศ">
          <Input name="country" defaultValue={partner?.country ?? ""} />
        </FormField>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <Checkbox name="isCompany" defaultChecked={partner?.isCompany ?? false} />
        เป็นบริษัท (นิติบุคคล)
      </label>

      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "กำลังบันทึก…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
