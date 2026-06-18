"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { container } from "@/src/infrastructure/di/container";
import { requireRole } from "@/src/infrastructure/auth/session";
import { parseScaled, QTY_SCALE } from "@/src/domain/services/money";
import { CreateLocationUseCase } from "@/src/application/use-cases/inventory/CreateLocationUseCase";
import { TransferStockUseCase } from "@/src/application/use-cases/inventory/TransferStockUseCase";
import { SetReorderRuleUseCase } from "@/src/application/use-cases/inventory/SetReorderRuleUseCase";

export interface FormState {
  error?: string;
  success?: string;
}

export async function createLocationAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireRole("shop_owner");
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "กรุณาระบุชื่อคลัง" };
  try {
    await new CreateLocationUseCase(container.stockLocationRepository).execute(user.shopId!, name);
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath("/shop/inventory/locations");
  return { success: "สร้างคลังแล้ว" };
}

const transferSchema = z.object({
  productId: z.string().min(1, "กรุณาเลือกสินค้า"),
  fromLocationId: z.string().min(1, "กรุณาเลือกคลังต้นทาง"),
  toLocationId: z.string().min(1, "กรุณาเลือกคลังปลายทาง"),
  qty: z.string().regex(/^\d+(\.\d+)?$/, "จำนวนไม่ถูกต้อง"),
});

export async function transferStockAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireRole("shop_owner");
  const parsed = transferSchema.safeParse({
    productId: formData.get("productId"),
    fromLocationId: formData.get("fromLocationId"),
    toLocationId: formData.get("toLocationId"),
    qty: formData.get("qty"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  try {
    await new TransferStockUseCase(
      container.stockLocationRepository,
      container.stockMoveRepository,
    ).execute({
      shopId: user.shopId!,
      productId: parsed.data.productId,
      fromLocationId: parsed.data.fromLocationId,
      toLocationId: parsed.data.toLocationId,
      qty: parseScaled(parsed.data.qty, QTY_SCALE),
    });
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath("/shop/inventory/transfer");
  return { success: "โอนสต๊อกแล้ว" };
}

export async function setReorderRuleAction(formData: FormData): Promise<void> {
  const user = await requireRole("shop_owner");
  const productId = String(formData.get("productId") ?? "");
  const minStr = String(formData.get("minQty") ?? "0").trim() || "0";
  const maxStr = String(formData.get("maxQty") ?? "0").trim() || "0";
  if (!/^\d+(\.\d+)?$/.test(minStr) || !/^\d+(\.\d+)?$/.test(maxStr)) return;
  const minQty = parseScaled(minStr, QTY_SCALE);
  // กัน max < min: ปรับ max ขึ้นให้เท่ากับ min (เลี่ยง error page)
  const maxQty = Math.max(minQty, parseScaled(maxStr, QTY_SCALE));
  await new SetReorderRuleUseCase(
    container.reorderRuleRepository,
    container.productRepository,
  ).execute(user.shopId!, productId, minQty, maxQty);
  revalidatePath("/shop/inventory/reorder");
}
