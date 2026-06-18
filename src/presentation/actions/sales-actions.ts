"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { container } from "@/src/infrastructure/di/container";
import { requireRole } from "@/src/infrastructure/auth/session";
import { parseScaled, QTY_SCALE } from "@/src/domain/services/money";
import { CreateQuotationUseCase } from "@/src/application/use-cases/sales/CreateQuotationUseCase";
import { ConfirmSalesOrderUseCase } from "@/src/application/use-cases/sales/ConfirmSalesOrderUseCase";
import { DeliverSalesOrderUseCase } from "@/src/application/use-cases/sales/DeliverSalesOrderUseCase";
import { InvoiceSalesOrderUseCase } from "@/src/application/use-cases/sales/InvoiceSalesOrderUseCase";
import { RegisterInvoicePaymentUseCase } from "@/src/application/use-cases/sales/RegisterInvoicePaymentUseCase";
import { CancelSalesOrderUseCase } from "@/src/application/use-cases/sales/CancelSalesOrderUseCase";
import { PostInvoiceJournalEntryUseCase } from "@/src/application/use-cases/accounting/PostInvoiceJournalEntryUseCase";
import { PostPaymentJournalEntryUseCase } from "@/src/application/use-cases/accounting/PostPaymentJournalEntryUseCase";
import { postDeps } from "./postingDeps";

export interface FormState {
  error?: string;
  success?: string;
}

const lineSchema = z.object({
  productId: z.string().min(1),
  qty: z.string().regex(/^\d+(\.\d+)?$/),
});
const quotationSchema = z.object({
  customerId: z.string().min(1, "กรุณาเลือกลูกค้า"),
  note: z.string().optional(),
  lines: z.array(lineSchema).min(1, "ต้องมีอย่างน้อย 1 รายการ"),
});

export async function createQuotationAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireRole("shop_owner");
  const shopId = user.shopId!;

  let linesRaw: unknown;
  try {
    linesRaw = JSON.parse(String(formData.get("lines") ?? "[]"));
  } catch {
    return { error: "รายการสินค้าไม่ถูกต้อง" };
  }
  const parsed = quotationSchema.safeParse({
    customerId: formData.get("customerId"),
    note: formData.get("note") || undefined,
    lines: linesRaw,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };

  let orderId: string;
  try {
    // snapshot ราคา/ภาษีจาก product ฝั่ง server (ไม่เชื่อ client)
    const lines = [];
    for (const l of parsed.data.lines) {
      const product = await container.productRepository.findById(shopId, l.productId);
      if (!product) return { error: "ไม่พบสินค้าในรายการ" };
      lines.push({
        productId: product.id,
        description: product.name,
        qtyOrdered: parseScaled(l.qty, QTY_SCALE),
        unitPrice: product.salePrice,
        taxRateBp: product.taxRateBp,
      });
    }
    const order = await new CreateQuotationUseCase(container.salesOrderRepository).execute({
      shopId,
      customerId: parsed.data.customerId,
      orderDate: new Date().toISOString(),
      note: parsed.data.note ?? null,
      lines,
    });
    orderId = order.id;
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath("/shop/sales");
  redirect(`/shop/sales/${orderId}`);
}

export async function confirmSalesOrderAction(formData: FormData): Promise<void> {
  const user = await requireRole("shop_owner");
  const id = String(formData.get("id") ?? "");
  await new ConfirmSalesOrderUseCase(
    container.salesOrderRepository,
    container.sequenceRepository,
  ).execute(user.shopId!, id, new Date().toISOString());
  revalidatePath(`/shop/sales/${id}`);
}

export async function deliverSalesOrderAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireRole("shop_owner");
  const id = String(formData.get("id") ?? "");
  const deliveries: { lineId: string; qty: number }[] = [];
  try {
    for (const [key, value] of formData.entries()) {
      if (!key.startsWith("qty_")) continue;
      const v = String(value).trim();
      if (!v || v === "0") continue;
      if (!/^\d+(\.\d+)?$/.test(v)) return { error: "จำนวนไม่ถูกต้อง" };
      deliveries.push({ lineId: key.slice(4), qty: parseScaled(v, QTY_SCALE) });
    }
    await new DeliverSalesOrderUseCase(
      container.salesOrderRepository,
      container.stockMoveRepository,
      container.stockLocationRepository,
    ).execute(user.shopId!, id, deliveries);
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath(`/shop/sales/${id}`);
  return { success: "บันทึกการส่งของแล้ว" };
}

export async function invoiceSalesOrderAction(formData: FormData): Promise<void> {
  const user = await requireRole("shop_owner");
  const id = String(formData.get("id") ?? "");
  const invoice = await new InvoiceSalesOrderUseCase(
    container.salesOrderRepository,
    container.invoiceRepository,
    container.sequenceRepository,
  ).execute(user.shopId!, id);
  // ลงบัญชีอัตโนมัติ: DR ลูกหนี้ / CR รายได้ + ภาษีขาย
  await new PostInvoiceJournalEntryUseCase(postDeps()).execute(invoice);
  revalidatePath(`/shop/sales/${id}`);
}

export async function registerPaymentAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireRole("shop_owner");
  const orderId = String(formData.get("orderId") ?? "");
  const invoiceId = String(formData.get("invoiceId") ?? "");
  const amountStr = String(formData.get("amount") ?? "");
  if (!/^\d+(\.\d+)?$/.test(amountStr)) return { error: "จำนวนเงินไม่ถูกต้อง" };
  try {
    const payment = await new RegisterInvoicePaymentUseCase(
      container.invoiceRepository,
      container.paymentRepository,
      container.salesOrderRepository,
      container.sequenceRepository,
    ).execute(user.shopId!, invoiceId, parseScaled(amountStr, 100), "cash", new Date().toISOString());
    // ลงบัญชีอัตโนมัติ: DR เงินสด / CR ลูกหนี้
    await new PostPaymentJournalEntryUseCase(postDeps()).execute(payment);
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath(`/shop/sales/${orderId}`);
  return { success: "รับชำระแล้ว" };
}

export async function cancelSalesOrderAction(formData: FormData): Promise<void> {
  const user = await requireRole("shop_owner");
  const id = String(formData.get("id") ?? "");
  await new CancelSalesOrderUseCase(container.salesOrderRepository).execute(user.shopId!, id);
  revalidatePath(`/shop/sales/${id}`);
}
