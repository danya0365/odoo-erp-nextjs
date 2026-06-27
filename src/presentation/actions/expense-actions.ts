"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { container } from "@/src/infrastructure/di/container";
import { requireRole } from "@/src/infrastructure/auth/session";
import { parseScaled } from "@/src/domain/services/money";
import { CreateExpenseClaimUseCase } from "@/src/application/use-cases/hr/CreateExpenseClaimUseCase";
import {
  ApproveExpenseClaimUseCase,
  RejectExpenseClaimUseCase,
  PayExpenseClaimUseCase,
} from "@/src/application/use-cases/hr/TransitionExpenseClaimUseCase";
import { PostExpenseJournalEntryUseCase } from "@/src/application/use-cases/accounting/PostExpenseJournalEntryUseCase";
import { postDeps } from "./postingDeps";

export interface FormState {
  error?: string;
  success?: string;
}

const createSchema = z.object({
  employeeId: z.string().min(1, "กรุณาเลือกพนักงาน"),
  category: z.string().optional(),
  description: z.string().optional(),
  amount: z.string().regex(/^\d+(\.\d+)?$/, "จำนวนเงินไม่ถูกต้อง"),
});

export async function createExpenseClaimAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireRole("shop_owner");
  const parsed = createSchema.safeParse({
    employeeId: formData.get("employeeId"),
    category: formData.get("category") || undefined,
    description: formData.get("description") || undefined,
    amount: formData.get("amount"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };

  let claimId: string;
  try {
    const claim = await new CreateExpenseClaimUseCase(
      container.expenseClaimRepository,
      container.employeeRepository,
      container.sequenceRepository,
    ).execute(user.shopId!, {
      employeeId: parsed.data.employeeId,
      category: parsed.data.category ?? "ทั่วไป",
      description: parsed.data.description ?? "",
      amount: parseScaled(parsed.data.amount, 100),
    });
    claimId = claim.id;
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath("/shop/hr/expenses");
  redirect(`/shop/hr/expenses/${claimId}`);
}

export async function approveExpenseClaimAction(formData: FormData): Promise<void> {
  const user = await requireRole("shop_owner");
  const id = String(formData.get("id") ?? "");
  await new ApproveExpenseClaimUseCase(container.expenseClaimRepository).execute(user.shopId!, id);
  revalidatePath(`/shop/hr/expenses/${id}`);
}

export async function rejectExpenseClaimAction(formData: FormData): Promise<void> {
  const user = await requireRole("shop_owner");
  const id = String(formData.get("id") ?? "");
  await new RejectExpenseClaimUseCase(container.expenseClaimRepository).execute(user.shopId!, id);
  revalidatePath(`/shop/hr/expenses/${id}`);
}

export async function payExpenseClaimAction(formData: FormData): Promise<void> {
  const user = await requireRole("shop_owner");
  const id = String(formData.get("id") ?? "");
  const claim = await new PayExpenseClaimUseCase(container.expenseClaimRepository).execute(
    user.shopId!,
    id,
    new Date().toISOString(),
  );
  // ลงบัญชีอัตโนมัติ: DR ค่าใช้จ่าย / CR เงินสด
  await new PostExpenseJournalEntryUseCase(postDeps()).execute(claim);
  revalidatePath(`/shop/hr/expenses/${id}`);
}
