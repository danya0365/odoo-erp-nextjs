import type { PurchaseOrder } from "@/src/domain/entities";
import { computeLine, sumDocument } from "@/src/domain/services/money";
import type {
  IPurchaseOrderRepository,
  CreatePurchaseOrderLineInput,
} from "@/src/application/repositories/IPurchaseOrderRepository";

export interface RfqLineInput {
  productId: string;
  description: string;
  qtyOrdered: number;
  unitPrice: number; // minor (cost)
  taxRateBp: number;
}

export interface CreateRfqInput {
  shopId: string;
  vendorId: string;
  currency?: string;
  orderDate: string;
  note?: string | null;
  lines: RfqLineInput[];
}

/** สร้างใบขอราคา (RFQ) จากผู้ขาย — คำนวณยอดด้วย money service */
export class CreateRfqUseCase {
  constructor(private readonly purchaseOrders: IPurchaseOrderRepository) {}

  async execute(input: CreateRfqInput): Promise<PurchaseOrder> {
    if (!input.vendorId) throw new Error("กรุณาเลือกผู้ขาย");
    if (input.lines.length === 0) throw new Error("ต้องมีอย่างน้อย 1 รายการ");

    const lines: CreatePurchaseOrderLineInput[] = input.lines.map((l) => {
      if (l.qtyOrdered <= 0) throw new Error("จำนวนต้องมากกว่า 0");
      const totals = computeLine(l.qtyOrdered, l.unitPrice, l.taxRateBp);
      return {
        productId: l.productId,
        description: l.description,
        qtyOrdered: l.qtyOrdered,
        unitPrice: l.unitPrice,
        taxRateBp: l.taxRateBp,
        lineSubtotal: totals.subtotal,
        lineTax: totals.tax,
        lineTotal: totals.total,
      };
    });
    const doc = sumDocument(lines.map((l) => ({ subtotal: l.lineSubtotal, tax: l.lineTax })));

    return this.purchaseOrders.createWithLines({
      shopId: input.shopId,
      vendorId: input.vendorId,
      currency: input.currency ?? "THB",
      orderDate: input.orderDate,
      note: input.note ?? null,
      untaxedAmount: doc.untaxed,
      taxAmount: doc.tax,
      totalAmount: doc.total,
      lines,
    });
  }
}
