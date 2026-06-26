"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { container } from "@/src/infrastructure/di/container";
import { parseScaled, QTY_SCALE } from "@/src/domain/services/money";
import { PlaceOnlineOrderUseCase } from "@/src/application/use-cases/storefront/PlaceOnlineOrderUseCase";
import { SubmitReviewUseCase } from "@/src/application/use-cases/storefront/SubmitReviewUseCase";

export interface FormState {
  error?: string;
}

const lineSchema = z.object({ productId: z.string().min(1), qty: z.string().regex(/^\d+(\.\d+)?$/) });
const checkoutSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1, "กรุณาระบุชื่อ"),
  email: z.string().min(1, "กรุณาระบุอีเมล"),
  phone: z.string().optional(),
  lines: z.array(lineSchema).min(1, "ตะกร้าว่าง"),
});

/** public — ไม่ต้องล็อกอิน (proxy ไม่ gate /store) */
export async function placeOrderAction(_prev: FormState, formData: FormData): Promise<FormState> {
  let linesRaw: unknown;
  try {
    linesRaw = JSON.parse(String(formData.get("lines") ?? "[]"));
  } catch {
    return { error: "ตะกร้าไม่ถูกต้อง" };
  }
  const parsed = checkoutSchema.safeParse({
    slug: formData.get("slug"),
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") || undefined,
    lines: linesRaw,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };

  let orderId: string;
  let slug: string;
  try {
    const order = await new PlaceOnlineOrderUseCase(
      container.shopRepository,
      container.productRepository,
      container.partnerRepository,
      container.salesOrderRepository,
      container.onlineOrderRepository,
      container.sequenceRepository,
    ).execute({
      slug: parsed.data.slug,
      customer: { name: parsed.data.name, email: parsed.data.email, phone: parsed.data.phone ?? null },
      lines: parsed.data.lines.map((l) => ({ productId: l.productId, qty: parseScaled(l.qty, QTY_SCALE) })),
      orderDate: new Date().toISOString(),
    });
    orderId = order.id;
    slug = parsed.data.slug;
  } catch (e) {
    return { error: (e as Error).message };
  }
  redirect(`/store/${slug}/order/${orderId}`);
}

const reviewSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1, "กรุณาระบุชื่อ"),
  rating: z.string().regex(/^[1-5]$/, "กรุณาให้คะแนน 1–5 ดาว"),
  comment: z.string().optional(),
});

/** public — ส่งรีวิวร้าน แล้ว redirect กลับหน้าร้าน (PRG: ไม่ค้าง + เห็นรีวิวใหม่ทันที) */
export async function submitReviewAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = reviewSchema.safeParse({
    slug: formData.get("slug"),
    name: formData.get("name"),
    rating: formData.get("rating"),
    comment: formData.get("comment") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };

  let slug: string;
  try {
    await new SubmitReviewUseCase(
      container.shopRepository,
      container.storeReviewRepository,
    ).execute({
      slug: parsed.data.slug,
      customerName: parsed.data.name,
      rating: Number(parsed.data.rating),
      comment: parsed.data.comment ?? null,
    });
    slug = parsed.data.slug;
  } catch (e) {
    return { error: (e as Error).message };
  }
  // PRG: กลับหน้าร้าน (GET) เพื่อโชว์รีวิวใหม่ — ไม่ค้างเพราะไม่ revalidate ค้างใน action
  redirect(`/store/${slug}?reviewed=1#reviews`);
}
