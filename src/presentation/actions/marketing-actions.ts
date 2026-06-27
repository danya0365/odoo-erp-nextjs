"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { container } from "@/src/infrastructure/di/container";
import { requireRole } from "@/src/infrastructure/auth/session";
import { parseScaled } from "@/src/domain/services/money";
import { DEFAULT_POINT_RATE } from "@/src/domain/services/promotion";
import { CreatePromotionUseCase, ApplyPromotionUseCase, EarnPointsUseCase, RedeemPointsUseCase } from "@/src/application/use-cases/marketing/MarketingUseCases";
import type { DiscountType } from "@/src/domain/entities";

export interface FormState {
  error?: string;
  success?: string;
}

const promoSchema = z.object({
  code: z.string().min(1, "กรุณาระบุโค้ด"),
  description: z.string().optional(),
  discountType: z.enum(["percent", "fixed"]),
  value: z.string().regex(/^\d+(\.\d+)?$/, "ค่าส่วนลดไม่ถูกต้อง"),
  minSpend: z.string().regex(/^\d+(\.\d+)?$/).optional().or(z.literal("")),
});

export async function createPromotionAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireRole("shop_owner");
  const parsed = promoSchema.safeParse({
    code: formData.get("code"),
    description: formData.get("description") || undefined,
    discountType: formData.get("discountType"),
    value: formData.get("value"),
    minSpend: formData.get("minSpend") || "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  try {
    const type = parsed.data.discountType as DiscountType;
    // percent: เก็บเป็นจำนวนเต็มเปอร์เซ็นต์; fixed: เก็บเป็น minor units
    const value = type === "percent" ? Math.round(Number(parsed.data.value)) : parseScaled(parsed.data.value, 100);
    await new CreatePromotionUseCase(container.promotionRepository).execute(
      user.shopId!,
      parsed.data.code,
      parsed.data.description ?? "",
      type,
      value,
      parsed.data.minSpend ? parseScaled(parsed.data.minSpend, 100) : 0,
    );
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath("/shop/marketing");
  return { success: "สร้างโปรโมชั่นแล้ว" };
}

export async function applyPromotionAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireRole("shop_owner");
  const code = String(formData.get("code") ?? "");
  const amountStr = String(formData.get("amount") ?? "");
  if (!/^\d+(\.\d+)?$/.test(amountStr)) return { error: "ยอดเงินไม่ถูกต้อง" };
  try {
    const res = await new ApplyPromotionUseCase(container.promotionRepository).execute(user.shopId!, code, parseScaled(amountStr, 100));
    const baht = (v: number) => (v / 100).toFixed(2);
    if (!res.eligible) return { error: "ยอดซื้อยังไม่ถึงขั้นต่ำของโปรนี้" };
    return { success: `ส่วนลด ฿${baht(res.discount)} → ยอดหลังลด ฿${baht(res.total)}` };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function togglePromotionAction(formData: FormData): Promise<void> {
  const user = await requireRole("shop_owner");
  const id = String(formData.get("id") ?? "");
  const active = String(formData.get("active") ?? "true") === "true";
  await container.promotionRepository.setActive(user.shopId!, id, active);
  revalidatePath("/shop/marketing");
}

export async function earnPointsAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireRole("shop_owner");
  const customerId = String(formData.get("customerId") ?? "");
  const amountStr = String(formData.get("amount") ?? "");
  if (!customerId) return { error: "กรุณาเลือกลูกค้า" };
  if (!/^\d+(\.\d+)?$/.test(amountStr)) return { error: "ยอดเงินไม่ถูกต้อง" };
  try {
    const acc = await new EarnPointsUseCase(container.loyaltyRepository, container.partnerRepository).execute(
      user.shopId!,
      customerId,
      parseScaled(amountStr, 100),
      DEFAULT_POINT_RATE,
    );
    return { success: `สะสมแต้มแล้ว — แต้มคงเหลือ ${acc.points}` };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function redeemPointsAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireRole("shop_owner");
  const customerId = String(formData.get("customerId") ?? "");
  const points = Number(formData.get("points") ?? "0") || 0;
  if (!customerId) return { error: "กรุณาเลือกลูกค้า" };
  try {
    const acc = await new RedeemPointsUseCase(container.loyaltyRepository).execute(user.shopId!, customerId, points);
    return { success: `แลกแต้มแล้ว — แต้มคงเหลือ ${acc.points}` };
  } catch (e) {
    return { error: (e as Error).message };
  }
}
