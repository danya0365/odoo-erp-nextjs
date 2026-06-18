"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { container } from "@/src/infrastructure/di/container";
import { requireRole } from "@/src/infrastructure/auth/session";
import { parseScaled, QTY_SCALE } from "@/src/domain/services/money";
import { OpenPosSessionUseCase } from "@/src/application/use-cases/pos/OpenPosSessionUseCase";
import { CheckoutPosOrderUseCase } from "@/src/application/use-cases/pos/CheckoutPosOrderUseCase";
import { ClosePosSessionUseCase } from "@/src/application/use-cases/pos/ClosePosSessionUseCase";
import type { CheckoutLine } from "@/src/application/use-cases/pos/CheckoutPosOrderUseCase";
import type { PosPaymentMethod } from "@/src/domain/entities";
import { postDeps } from "./postingDeps";

export interface FormState {
  error?: string;
  success?: string;
}

export async function openSessionAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireRole("shop_owner");
  const openStr = String(formData.get("openingCash") ?? "0").trim() || "0";
  if (!/^\d+(\.\d+)?$/.test(openStr)) return { error: "เงินตั้งต้นไม่ถูกต้อง" };
  try {
    await new OpenPosSessionUseCase(container.posSessionRepository).execute(
      user.shopId!,
      user.id,
      parseScaled(openStr, 100),
      new Date().toISOString(),
    );
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath("/shop/pos");
  return { success: "เปิดกะแล้ว" };
}

const cartLineSchema = z.object({ productId: z.string().min(1), qty: z.string().regex(/^\d+(\.\d+)?$/) });
const checkoutSchema = z.object({
  sessionId: z.string().min(1),
  paymentMethod: z.enum(["cash", "transfer"]),
  lines: z.array(cartLineSchema).min(1, "ตะกร้าว่าง"),
});

export async function checkoutAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireRole("shop_owner");
  const shopId = user.shopId!;
  let linesRaw: unknown;
  try {
    linesRaw = JSON.parse(String(formData.get("lines") ?? "[]"));
  } catch {
    return { error: "ตะกร้าไม่ถูกต้อง" };
  }
  const parsed = checkoutSchema.safeParse({
    sessionId: formData.get("sessionId"),
    paymentMethod: formData.get("paymentMethod"),
    lines: linesRaw,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };

  try {
    const lines: CheckoutLine[] = [];
    for (const l of parsed.data.lines) {
      const product = await container.productRepository.findById(shopId, l.productId);
      if (!product) return { error: "ไม่พบสินค้า" };
      lines.push({
        productId: product.id,
        description: product.name,
        qty: parseScaled(l.qty, QTY_SCALE),
        unitPrice: product.salePrice,
        taxRateBp: product.taxRateBp,
        isStockable: product.type === "stockable",
      });
    }
    const order = await new CheckoutPosOrderUseCase(
      container.posSessionRepository,
      container.posOrderRepository,
      container.stockMoveRepository,
      container.stockLocationRepository,
      container.sequenceRepository,
      postDeps(),
    ).execute({
      shopId,
      sessionId: parsed.data.sessionId,
      paymentMethod: parsed.data.paymentMethod as PosPaymentMethod,
      lines,
      now: new Date().toISOString(),
    });
    revalidatePath("/shop/pos");
    // ข้อความ unique ต่อบิล → ใช้เป็น key รีเซ็ตตะกร้าฝั่ง client
    return { success: `ขายสำเร็จ (${order.docNumber})` };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function closeSessionAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireRole("shop_owner");
  const sessionId = String(formData.get("sessionId") ?? "");
  const countedStr = String(formData.get("countedCash") ?? "0").trim() || "0";
  if (!/^\d+(\.\d+)?$/.test(countedStr)) return { error: "ยอดเงินไม่ถูกต้อง" };
  let id = sessionId;
  try {
    const closed = await new ClosePosSessionUseCase(
      container.posSessionRepository,
      container.posOrderRepository,
    ).execute(user.shopId!, sessionId, parseScaled(countedStr, 100), new Date().toISOString());
    id = closed.id;
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath("/shop/pos");
  redirect(`/shop/pos/sessions/${id}`);
}
