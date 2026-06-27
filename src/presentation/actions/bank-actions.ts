"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { container } from "@/src/infrastructure/di/container";
import { requireRole } from "@/src/infrastructure/auth/session";
import { parseScaled } from "@/src/domain/services/money";
import {
  ImportBankLineUseCase,
  ReconcileBankLineUseCase,
  ClosePeriodUseCase,
} from "@/src/application/use-cases/accounting/BankReconciliationUseCases";

export interface FormState {
  error?: string;
  success?: string;
}

const importSchema = z.object({
  statementDate: z.string().min(1, "กรุณาระบุวันที่"),
  description: z.string().optional(),
  amount: z.string().regex(/^-?\d+(\.\d+)?$/, "จำนวนเงินไม่ถูกต้อง"),
});

export async function importBankLineAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireRole("shop_owner");
  const parsed = importSchema.safeParse({
    statementDate: formData.get("statementDate"),
    description: formData.get("description") || undefined,
    amount: formData.get("amount"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  try {
    await new ImportBankLineUseCase(container.bankStatementRepository).execute(
      user.shopId!,
      parsed.data.statementDate,
      parsed.data.description ?? "",
      parseScaled(parsed.data.amount, 100),
    );
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath("/shop/accounting/bank-reconciliation");
  return { success: "นำเข้าแล้ว" };
}

export async function reconcileBankLineAction(formData: FormData): Promise<void> {
  const user = await requireRole("shop_owner");
  const id = String(formData.get("id") ?? "");
  const reconciled = String(formData.get("reconciled") ?? "true") === "true";
  await new ReconcileBankLineUseCase(container.bankStatementRepository).execute(user.shopId!, id, reconciled);
  revalidatePath("/shop/accounting/bank-reconciliation");
}

export async function closePeriodAction(formData: FormData): Promise<void> {
  const user = await requireRole("shop_owner");
  const period = String(formData.get("period") ?? "");
  if (!/^\d{4}-\d{2}$/.test(period)) return;
  await new ClosePeriodUseCase(container.periodCloseRepository).execute(
    user.shopId!,
    period,
    null,
    new Date().toISOString(),
  );
  revalidatePath("/shop/accounting/financials");
}
