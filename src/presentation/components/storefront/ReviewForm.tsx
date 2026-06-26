"use client";

import { useActionState } from "react";

import { submitReviewAction, type FormState } from "@/src/presentation/actions/storefront-actions";
import { FormField } from "@/src/presentation/components/ui/FormField";
import { Input } from "@/src/presentation/components/ui/Input";
import { Select } from "@/src/presentation/components/ui/Select";
import { Textarea } from "@/src/presentation/components/ui/Textarea";
import { Button } from "@/src/presentation/components/ui/Button";
import { Alert } from "@/src/presentation/components/ui/Alert";

export function ReviewForm({ slug }: { slug: string }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(submitReviewAction, {});
  return (
    <form action={formAction} className="flex flex-col gap-3">
      {state.error && <Alert variant="error">{state.error}</Alert>}
      <input type="hidden" name="slug" value={slug} />
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField label="ชื่อของคุณ" required>
          <Input name="name" />
        </FormField>
        <FormField label="ให้คะแนน" required>
          <Select name="rating" defaultValue="5" aria-label="ให้คะแนน">
            <option value="5">★★★★★ (5)</option>
            <option value="4">★★★★ (4)</option>
            <option value="3">★★★ (3)</option>
            <option value="2">★★ (2)</option>
            <option value="1">★ (1)</option>
          </Select>
        </FormField>
      </div>
      <FormField label="ความคิดเห็น">
        <Textarea name="comment" rows={3} placeholder="บอกประสบการณ์กับร้านนี้…" />
      </FormField>
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "กำลังส่ง…" : "ส่งรีวิว"}
        </Button>
      </div>
    </form>
  );
}
