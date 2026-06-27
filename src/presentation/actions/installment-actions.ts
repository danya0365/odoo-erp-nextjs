"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { container } from "@/src/infrastructure/di/container";
import { requireRole } from "@/src/infrastructure/auth/session";
import { CreateInstallmentPlanUseCase } from "@/src/application/use-cases/sales/CreateInstallmentPlanUseCase";
import { PayInstallmentUseCase } from "@/src/application/use-cases/sales/PayInstallmentUseCase";
import { PostPaymentJournalEntryUseCase } from "@/src/application/use-cases/accounting/PostPaymentJournalEntryUseCase";
import { postDeps } from "./postingDeps";

export interface FormState {
  error?: string;
  success?: string;
}

const createSchema = z.object({
  invoiceId: z.string().min(1, "กรุณาเลือกใบแจ้งหนี้"),
  count: z.coerce.number().int().min(1).max(36),
  intervalDays: z.coerce.number().int().min(1).max(365),
});

export async function createInstallmentPlanAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireRole("shop_owner");
  const parsed = createSchema.safeParse({
    invoiceId: formData.get("invoiceId"),
    count: formData.get("count"),
    intervalDays: formData.get("intervalDays"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };

  let planId: string;
  try {
    const plan = await new CreateInstallmentPlanUseCase(
      container.installmentPlanRepository,
      container.invoiceRepository,
    ).execute(user.shopId!, parsed.data.invoiceId, parsed.data.count, parsed.data.intervalDays, new Date().toISOString());
    planId = plan.id;
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath("/shop/sales/installments");
  redirect(`/shop/sales/installments/${planId}`);
}

export async function payInstallmentAction(formData: FormData): Promise<void> {
  const user = await requireRole("shop_owner");
  const planId = String(formData.get("planId") ?? "");
  const lineId = String(formData.get("lineId") ?? "");
  const payment = await new PayInstallmentUseCase(
    container.installmentPlanRepository,
    container.invoiceRepository,
    container.paymentRepository,
    container.salesOrderRepository,
    container.sequenceRepository,
  ).execute(user.shopId!, planId, lineId, new Date().toISOString());
  // ลงบัญชีอัตโนมัติ: DR เงินสด / CR ลูกหนี้
  await new PostPaymentJournalEntryUseCase(postDeps()).execute(payment);
  revalidatePath(`/shop/sales/installments/${planId}`);
}
