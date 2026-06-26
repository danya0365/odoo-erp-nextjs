"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { container } from "@/src/infrastructure/di/container";
import { requireRole } from "@/src/infrastructure/auth/session";
import { parseScaled, QTY_SCALE } from "@/src/domain/services/money";
import { CreateSalesReturnUseCase } from "@/src/application/use-cases/sales-returns/CreateSalesReturnUseCase";
import { ConfirmSalesReturnUseCase } from "@/src/application/use-cases/sales-returns/ConfirmSalesReturnUseCase";
import { RefundSalesReturnUseCase } from "@/src/application/use-cases/sales-returns/RefundSalesReturnUseCase";
import { PostCreditNoteJournalEntryUseCase } from "@/src/application/use-cases/accounting/PostCreditNoteJournalEntryUseCase";
import { PostRefundJournalEntryUseCase } from "@/src/application/use-cases/accounting/PostRefundJournalEntryUseCase";
import { postDeps } from "./postingDeps";

export interface FormState {
  error?: string;
  success?: string;
}

const createSchema = z.object({
  invoiceId: z.string().min(1, "กรุณาเลือกใบแจ้งหนี้"),
  reason: z.string().optional(),
});

export async function createSalesReturnAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireRole("shop_owner");
  const shopId = user.shopId!;

  const parsed = createSchema.safeParse({
    invoiceId: formData.get("invoiceId"),
    reason: formData.get("reason") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };

  // อ่านจำนวนคืนต่อบรรทัด (qty_<invoiceLineId>)
  const lines: { invoiceLineId: string; qty: number }[] = [];
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("qty_")) continue;
    const v = String(value).trim();
    if (!v || v === "0") continue;
    if (!/^\d+(\.\d+)?$/.test(v)) return { error: "จำนวนไม่ถูกต้อง" };
    lines.push({ invoiceLineId: key.slice(4), qty: parseScaled(v, QTY_SCALE) });
  }
  if (lines.length === 0) return { error: "กรุณาระบุจำนวนที่จะคืนอย่างน้อย 1 รายการ" };

  let returnId: string;
  try {
    const ret = await new CreateSalesReturnUseCase(
      container.salesReturnRepository,
      container.invoiceRepository,
      container.sequenceRepository,
    ).execute(shopId, parsed.data.invoiceId, lines, parsed.data.reason ?? null);
    returnId = ret.id;
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath("/shop/sales/returns");
  redirect(`/shop/sales/returns/${returnId}`);
}

export async function confirmSalesReturnAction(formData: FormData): Promise<void> {
  const user = await requireRole("shop_owner");
  const id = String(formData.get("id") ?? "");
  const ret = await new ConfirmSalesReturnUseCase(
    container.salesReturnRepository,
    container.stockMoveRepository,
    container.stockLocationRepository,
  ).execute(user.shopId!, id);
  // ลงบัญชีอัตโนมัติ: DR รายได้ + ภาษีขาย / CR ลูกหนี้ (ใบลดหนี้)
  await new PostCreditNoteJournalEntryUseCase(postDeps()).execute(ret);
  revalidatePath(`/shop/sales/returns/${id}`);
}

export async function refundSalesReturnAction(formData: FormData): Promise<void> {
  const user = await requireRole("shop_owner");
  const id = String(formData.get("id") ?? "");
  const ret = await new RefundSalesReturnUseCase(
    container.salesReturnRepository,
    container.paymentRepository,
    container.sequenceRepository,
  ).execute(user.shopId!, id, "cash", new Date().toISOString());
  // ลงบัญชีอัตโนมัติ: DR ลูกหนี้ / CR เงินสด (คืนเงิน)
  await new PostRefundJournalEntryUseCase(postDeps()).execute(ret);
  revalidatePath(`/shop/sales/returns/${id}`);
}
