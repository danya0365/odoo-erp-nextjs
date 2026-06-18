"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { container } from "@/src/infrastructure/di/container";
import { requireRole } from "@/src/infrastructure/auth/session";
import { parseScaled, QTY_SCALE } from "@/src/domain/services/money";
import { CreateProductUseCase } from "@/src/application/use-cases/inventory/CreateProductUseCase";
import { UpdateProductUseCase } from "@/src/application/use-cases/inventory/UpdateProductUseCase";
import { AdjustStockUseCase } from "@/src/application/use-cases/inventory/AdjustStockUseCase";

export interface FormState {
  error?: string;
  success?: string;
}

const numStr = z
  .string()
  .trim()
  .regex(/^\d+(\.\d+)?$/, "ตัวเลขไม่ถูกต้อง")
  .default("0");

const productSchema = z.object({
  sku: z.string().trim().min(1, "กรุณาระบุรหัสสินค้า (SKU)"),
  name: z.string().trim().min(1, "กรุณาระบุชื่อสินค้า"),
  type: z.enum(["stockable", "service", "consumable"]),
  salePrice: numStr,
  costPrice: numStr,
  taxRate: numStr, // เปอร์เซ็นต์ เช่น "7"
  uom: z.string().trim().min(1).default("หน่วย"),
});

function parseProduct(formData: FormData) {
  return productSchema.safeParse({
    sku: formData.get("sku"),
    name: formData.get("name"),
    type: formData.get("type"),
    salePrice: formData.get("salePrice") || "0",
    costPrice: formData.get("costPrice") || "0",
    taxRate: formData.get("taxRate") || "0",
    uom: formData.get("uom") || "หน่วย",
  });
}

function toMoney(d: z.infer<typeof productSchema>) {
  return {
    salePrice: parseScaled(d.salePrice, 100),
    costPrice: parseScaled(d.costPrice, 100),
    taxRateBp: parseScaled(d.taxRate, 100), // 7% → 700
  };
}

export async function createProductAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireRole("shop_owner");
  const parsed = parseProduct(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };

  try {
    const money = toMoney(parsed.data);
    await new CreateProductUseCase(container.productRepository).execute({
      shopId: user.shopId!,
      sku: parsed.data.sku,
      name: parsed.data.name,
      type: parsed.data.type,
      uom: parsed.data.uom,
      ...money,
    });
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath("/shop/products");
  redirect("/shop/products");
}

export async function updateProductAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireRole("shop_owner");
  const id = String(formData.get("id") ?? "");
  const parsed = parseProduct(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };

  try {
    const money = toMoney(parsed.data);
    await new UpdateProductUseCase(container.productRepository).execute(user.shopId!, id, {
      sku: parsed.data.sku,
      name: parsed.data.name,
      type: parsed.data.type,
      uom: parsed.data.uom,
      ...money,
    });
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath("/shop/products");
  revalidatePath(`/shop/products/${id}`);
  redirect("/shop/products");
}

export async function archiveProductAction(formData: FormData): Promise<void> {
  const user = await requireRole("shop_owner");
  const id = String(formData.get("id") ?? "");
  const isActive = formData.get("isActive") === "true";
  await container.productRepository.setActive(user.shopId!, id, isActive);
  revalidatePath("/shop/products");
  redirect("/shop/products");
}

const adjustSchema = z.object({
  id: z.string().min(1),
  qty: z.string().trim().regex(/^\d+(\.\d+)?$/, "จำนวนไม่ถูกต้อง"),
  direction: z.enum(["in", "out"]),
  note: z.string().trim().optional(),
});

export async function adjustStockAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireRole("shop_owner");
  const parsed = adjustSchema.safeParse({
    id: formData.get("id"),
    qty: formData.get("qty"),
    direction: formData.get("direction"),
    note: formData.get("note") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };

  try {
    const magnitude = parseScaled(parsed.data.qty, QTY_SCALE);
    const qtyDelta = parsed.data.direction === "out" ? -magnitude : magnitude;
    await new AdjustStockUseCase(
      container.productRepository,
      container.stockMoveRepository,
      container.stockLocationRepository,
    ).execute({
      shopId: user.shopId!,
      productId: parsed.data.id,
      qtyDelta,
      note: parsed.data.note ?? null,
    });
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath(`/shop/products/${parsed.data.id}`);
  return { success: "ปรับสต๊อกแล้ว" };
}
