"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { container } from "@/src/infrastructure/di/container";
import { requireRole } from "@/src/infrastructure/auth/session";
import { parseScaled, QTY_SCALE } from "@/src/domain/services/money";
import { ReceiveLotUseCase, AllocateFefoUseCase } from "@/src/application/use-cases/inventory/LotUseCases";

export interface FormState {
  error?: string;
  success?: string;
}

const receiveSchema = z.object({
  productId: z.string().min(1, "กรุณาเลือกสินค้า"),
  lotNumber: z.string().optional(),
  expiryDate: z.string().min(1, "กรุณาระบุวันหมดอายุ"),
  qty: z.string().regex(/^\d+(\.\d+)?$/, "จำนวนไม่ถูกต้อง"),
});

export async function receiveLotAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireRole("shop_owner");
  const parsed = receiveSchema.safeParse({
    productId: formData.get("productId"),
    lotNumber: formData.get("lotNumber") || undefined,
    expiryDate: formData.get("expiryDate"),
    qty: formData.get("qty"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  try {
    await new ReceiveLotUseCase(container.productLotRepository, container.productRepository).execute(
      user.shopId!,
      parsed.data.productId,
      parsed.data.lotNumber ?? "",
      parsed.data.expiryDate,
      parseScaled(parsed.data.qty, QTY_SCALE),
    );
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath("/shop/inventory/lots");
  return { success: "รับเข้าล็อตแล้ว" };
}

const allocSchema = z.object({
  productId: z.string().min(1, "กรุณาเลือกสินค้า"),
  qty: z.string().regex(/^\d+(\.\d+)?$/, "จำนวนไม่ถูกต้อง"),
});

export async function allocateFefoAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireRole("shop_owner");
  const parsed = allocSchema.safeParse({ productId: formData.get("productId"), qty: formData.get("qty") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  try {
    const allocations = await new AllocateFefoUseCase(container.productLotRepository).execute(
      user.shopId!,
      parsed.data.productId,
      parseScaled(parsed.data.qty, QTY_SCALE),
    );
    const lots = await container.productLotRepository.listAll(user.shopId!);
    const desc = allocations
      .map((a) => {
        const l = lots.find((x) => x.id === a.lotId);
        return `${l?.lotNumber || "ล็อต"} (หมดอายุ ${l?.expiryDate}) × ${a.qty / QTY_SCALE}`;
      })
      .join(", ");
    revalidatePath("/shop/inventory/lots");
    return { success: `ตัด FEFO: ${desc}` };
  } catch (e) {
    return { error: (e as Error).message };
  }
}
