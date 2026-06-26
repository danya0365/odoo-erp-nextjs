"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { container } from "@/src/infrastructure/di/container";
import { requireRole } from "@/src/infrastructure/auth/session";
import { parseScaled, QTY_SCALE } from "@/src/domain/services/money";
import { CreateStockCountUseCase } from "@/src/application/use-cases/inventory/CreateStockCountUseCase";
import { ApplyStockCountUseCase } from "@/src/application/use-cases/inventory/ApplyStockCountUseCase";

export interface FormState {
  error?: string;
  success?: string;
}

export async function createStockCountAction(formData: FormData): Promise<void> {
  const user = await requireRole("shop_owner");
  const note = String(formData.get("note") ?? "") || null;
  const sc = await new CreateStockCountUseCase(
    container.stockCountRepository,
    container.productRepository,
    container.stockMoveRepository,
    container.sequenceRepository,
  ).execute(user.shopId!, note);
  revalidatePath("/shop/inventory/stocktake");
  redirect(`/shop/inventory/stocktake/${sc.id}`);
}

export async function applyStockCountAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireRole("shop_owner");
  const id = String(formData.get("id") ?? "");
  const counts: { lineId: string; countedQty: number }[] = [];
  try {
    for (const [key, value] of formData.entries()) {
      if (!key.startsWith("cnt_")) continue;
      const v = String(value).trim();
      if (!/^\d+(\.\d+)?$/.test(v)) return { error: "จำนวนนับไม่ถูกต้อง" };
      counts.push({ lineId: key.slice(4), countedQty: parseScaled(v, QTY_SCALE) });
    }
    await new ApplyStockCountUseCase(
      container.stockCountRepository,
      container.stockMoveRepository,
      container.stockLocationRepository,
    ).execute(user.shopId!, id, counts);
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath(`/shop/inventory/stocktake/${id}`);
  return { success: "ปรับสต๊อกตามผลนับแล้ว" };
}
