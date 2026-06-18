"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { container } from "@/src/infrastructure/di/container";
import { requireRole } from "@/src/infrastructure/auth/session";
import { parseScaled, QTY_SCALE } from "@/src/domain/services/money";
import { CreateRfqUseCase } from "@/src/application/use-cases/purchase/CreateRfqUseCase";
import { ConfirmPurchaseOrderUseCase } from "@/src/application/use-cases/purchase/ConfirmPurchaseOrderUseCase";
import { ReceivePurchaseOrderUseCase } from "@/src/application/use-cases/purchase/ReceivePurchaseOrderUseCase";
import { CreateVendorBillUseCase } from "@/src/application/use-cases/purchase/CreateVendorBillUseCase";
import { RegisterBillPaymentUseCase } from "@/src/application/use-cases/purchase/RegisterBillPaymentUseCase";
import { CancelPurchaseOrderUseCase } from "@/src/application/use-cases/purchase/CancelPurchaseOrderUseCase";

export interface FormState {
  error?: string;
  success?: string;
}

const lineSchema = z.object({ productId: z.string().min(1), qty: z.string().regex(/^\d+(\.\d+)?$/) });
const rfqSchema = z.object({
  vendorId: z.string().min(1, "กรุณาเลือกผู้ขาย"),
  note: z.string().optional(),
  lines: z.array(lineSchema).min(1, "ต้องมีอย่างน้อย 1 รายการ"),
});

export async function createRfqAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireRole("shop_owner");
  const shopId = user.shopId!;
  let linesRaw: unknown;
  try {
    linesRaw = JSON.parse(String(formData.get("lines") ?? "[]"));
  } catch {
    return { error: "รายการสินค้าไม่ถูกต้อง" };
  }
  const parsed = rfqSchema.safeParse({
    vendorId: formData.get("vendorId"),
    note: formData.get("note") || undefined,
    lines: linesRaw,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };

  let orderId: string;
  try {
    const lines = [];
    for (const l of parsed.data.lines) {
      const product = await container.productRepository.findById(shopId, l.productId);
      if (!product) return { error: "ไม่พบสินค้าในรายการ" };
      lines.push({
        productId: product.id,
        description: product.name,
        qtyOrdered: parseScaled(l.qty, QTY_SCALE),
        unitPrice: product.costPrice, // snapshot ราคาทุน
        taxRateBp: product.taxRateBp,
      });
    }
    const order = await new CreateRfqUseCase(container.purchaseOrderRepository).execute({
      shopId,
      vendorId: parsed.data.vendorId,
      orderDate: new Date().toISOString(),
      note: parsed.data.note ?? null,
      lines,
    });
    orderId = order.id;
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath("/shop/purchase");
  redirect(`/shop/purchase/${orderId}`);
}

export async function confirmPurchaseOrderAction(formData: FormData): Promise<void> {
  const user = await requireRole("shop_owner");
  const id = String(formData.get("id") ?? "");
  await new ConfirmPurchaseOrderUseCase(
    container.purchaseOrderRepository,
    container.sequenceRepository,
  ).execute(user.shopId!, id, new Date().toISOString());
  revalidatePath(`/shop/purchase/${id}`);
}

export async function receivePurchaseOrderAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireRole("shop_owner");
  const id = String(formData.get("id") ?? "");
  const receipts: { lineId: string; qty: number }[] = [];
  try {
    for (const [key, value] of formData.entries()) {
      if (!key.startsWith("qty_")) continue;
      const v = String(value).trim();
      if (!v || v === "0") continue;
      if (!/^\d+(\.\d+)?$/.test(v)) return { error: "จำนวนไม่ถูกต้อง" };
      receipts.push({ lineId: key.slice(4), qty: parseScaled(v, QTY_SCALE) });
    }
    await new ReceivePurchaseOrderUseCase(
      container.purchaseOrderRepository,
      container.stockMoveRepository,
      container.stockLocationRepository,
    ).execute(user.shopId!, id, receipts);
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath(`/shop/purchase/${id}`);
  return { success: "บันทึกการรับของแล้ว" };
}

export async function createVendorBillAction(formData: FormData): Promise<void> {
  const user = await requireRole("shop_owner");
  const id = String(formData.get("id") ?? "");
  await new CreateVendorBillUseCase(
    container.purchaseOrderRepository,
    container.vendorBillRepository,
    container.sequenceRepository,
  ).execute(user.shopId!, id);
  revalidatePath(`/shop/purchase/${id}`);
}

export async function registerBillPaymentAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireRole("shop_owner");
  const orderId = String(formData.get("orderId") ?? "");
  const billId = String(formData.get("billId") ?? "");
  const amountStr = String(formData.get("amount") ?? "");
  if (!/^\d+(\.\d+)?$/.test(amountStr)) return { error: "จำนวนเงินไม่ถูกต้อง" };
  try {
    await new RegisterBillPaymentUseCase(
      container.vendorBillRepository,
      container.paymentRepository,
      container.purchaseOrderRepository,
      container.sequenceRepository,
    ).execute(user.shopId!, billId, parseScaled(amountStr, 100), "cash", new Date().toISOString());
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath(`/shop/purchase/${orderId}`);
  return { success: "บันทึกการจ่ายเงินแล้ว" };
}

export async function cancelPurchaseOrderAction(formData: FormData): Promise<void> {
  const user = await requireRole("shop_owner");
  const id = String(formData.get("id") ?? "");
  await new CancelPurchaseOrderUseCase(container.purchaseOrderRepository).execute(user.shopId!, id);
  revalidatePath(`/shop/purchase/${id}`);
}
