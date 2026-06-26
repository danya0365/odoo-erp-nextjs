"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { container } from "@/src/infrastructure/di/container";
import { requireRole } from "@/src/infrastructure/auth/session";
import { parseScaled, QTY_SCALE } from "@/src/domain/services/money";
import { CreatePurchaseReturnUseCase } from "@/src/application/use-cases/purchase-returns/CreatePurchaseReturnUseCase";
import { ConfirmPurchaseReturnUseCase } from "@/src/application/use-cases/purchase-returns/ConfirmPurchaseReturnUseCase";
import { PostVendorCreditJournalEntryUseCase } from "@/src/application/use-cases/accounting/PostVendorCreditJournalEntryUseCase";
import { postDeps } from "./postingDeps";

export interface FormState {
  error?: string;
  success?: string;
}

const createSchema = z.object({
  vendorBillId: z.string().min(1, "กรุณาเลือกใบตั้งหนี้"),
  reason: z.string().optional(),
});

export async function createPurchaseReturnAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireRole("shop_owner");
  const shopId = user.shopId!;

  const parsed = createSchema.safeParse({
    vendorBillId: formData.get("vendorBillId"),
    reason: formData.get("reason") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };

  const lines: { billLineId: string; qty: number }[] = [];
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("qty_")) continue;
    const v = String(value).trim();
    if (!v || v === "0") continue;
    if (!/^\d+(\.\d+)?$/.test(v)) return { error: "จำนวนไม่ถูกต้อง" };
    lines.push({ billLineId: key.slice(4), qty: parseScaled(v, QTY_SCALE) });
  }
  if (lines.length === 0) return { error: "กรุณาระบุจำนวนที่จะคืนอย่างน้อย 1 รายการ" };

  let returnId: string;
  try {
    const ret = await new CreatePurchaseReturnUseCase(
      container.purchaseReturnRepository,
      container.vendorBillRepository,
      container.sequenceRepository,
    ).execute(shopId, parsed.data.vendorBillId, lines, parsed.data.reason ?? null);
    returnId = ret.id;
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath("/shop/purchase/returns");
  redirect(`/shop/purchase/returns/${returnId}`);
}

export async function confirmPurchaseReturnAction(formData: FormData): Promise<void> {
  const user = await requireRole("shop_owner");
  const id = String(formData.get("id") ?? "");
  const ret = await new ConfirmPurchaseReturnUseCase(
    container.purchaseReturnRepository,
    container.stockMoveRepository,
    container.stockLocationRepository,
  ).execute(user.shopId!, id);
  // ลงบัญชีอัตโนมัติ: DR เจ้าหนี้ / CR ค่าใช้จ่าย + ภาษีซื้อ (ใบลดหนี้ผู้ขาย)
  await new PostVendorCreditJournalEntryUseCase(postDeps()).execute(ret);
  revalidatePath(`/shop/purchase/returns/${id}`);
}
