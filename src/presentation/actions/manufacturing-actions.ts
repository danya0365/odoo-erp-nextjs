"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { container } from "@/src/infrastructure/di/container";
import { requireRole } from "@/src/infrastructure/auth/session";
import { parseScaled, QTY_SCALE } from "@/src/domain/services/money";
import { CreateBomUseCase } from "@/src/application/use-cases/manufacturing/CreateBomUseCase";
import { CreateManufacturingOrderUseCase } from "@/src/application/use-cases/manufacturing/CreateManufacturingOrderUseCase";
import { ConfirmManufacturingOrderUseCase } from "@/src/application/use-cases/manufacturing/ConfirmManufacturingOrderUseCase";
import { ProduceManufacturingOrderUseCase } from "@/src/application/use-cases/manufacturing/ProduceManufacturingOrderUseCase";
import { CancelManufacturingOrderUseCase } from "@/src/application/use-cases/manufacturing/CancelManufacturingOrderUseCase";

export interface FormState {
  error?: string;
  success?: string;
}

const bomLineSchema = z.object({
  componentId: z.string().min(1),
  qtyPerUnit: z.string().regex(/^\d+(\.\d+)?$/),
});
const bomSchema = z.object({
  productId: z.string().min(1, "กรุณาเลือกสินค้าสำเร็จรูป"),
  name: z.string().min(1, "กรุณาระบุชื่อสูตร"),
  lines: z.array(bomLineSchema).min(1, "ต้องมีวัตถุดิบอย่างน้อย 1 รายการ"),
});

export async function createBomAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireRole("shop_owner");
  let linesRaw: unknown;
  try {
    linesRaw = JSON.parse(String(formData.get("lines") ?? "[]"));
  } catch {
    return { error: "รายการวัตถุดิบไม่ถูกต้อง" };
  }
  const parsed = bomSchema.safeParse({
    productId: formData.get("productId"),
    name: formData.get("name"),
    lines: linesRaw,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };

  try {
    await new CreateBomUseCase(container.bomRepository, container.productRepository).execute({
      shopId: user.shopId!,
      productId: parsed.data.productId,
      name: parsed.data.name,
      lines: parsed.data.lines.map((l) => ({
        componentId: l.componentId,
        qtyPerUnit: parseScaled(l.qtyPerUnit, QTY_SCALE),
      })),
    });
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath("/shop/manufacturing/boms");
  redirect("/shop/manufacturing/boms");
}

const moSchema = z.object({
  bomId: z.string().min(1, "กรุณาเลือกสูตร"),
  qty: z.string().regex(/^\d+(\.\d+)?$/, "จำนวนไม่ถูกต้อง"),
});

export async function createMoAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireRole("shop_owner");
  const parsed = moSchema.safeParse({ bomId: formData.get("bomId"), qty: formData.get("qty") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };

  let orderId: string;
  try {
    const order = await new CreateManufacturingOrderUseCase(
      container.bomRepository,
      container.manufacturingOrderRepository,
    ).execute(user.shopId!, parsed.data.bomId, parseScaled(parsed.data.qty, QTY_SCALE));
    orderId = order.id;
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath("/shop/manufacturing");
  redirect(`/shop/manufacturing/${orderId}`);
}

export async function confirmMoAction(formData: FormData): Promise<void> {
  const user = await requireRole("shop_owner");
  const id = String(formData.get("id") ?? "");
  await new ConfirmManufacturingOrderUseCase(
    container.manufacturingOrderRepository,
    container.sequenceRepository,
  ).execute(user.shopId!, id);
  revalidatePath(`/shop/manufacturing/${id}`);
}

export async function produceMoAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireRole("shop_owner");
  const id = String(formData.get("id") ?? "");
  try {
    await new ProduceManufacturingOrderUseCase(
      container.manufacturingOrderRepository,
      container.bomRepository,
      container.stockMoveRepository,
      container.stockLocationRepository,
    ).execute(user.shopId!, id);
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath(`/shop/manufacturing/${id}`);
  return { success: "ผลิตสำเร็จ" };
}

export async function cancelMoAction(formData: FormData): Promise<void> {
  const user = await requireRole("shop_owner");
  const id = String(formData.get("id") ?? "");
  await new CancelManufacturingOrderUseCase(container.manufacturingOrderRepository).execute(
    user.shopId!,
    id,
  );
  revalidatePath(`/shop/manufacturing/${id}`);
}
