import type { SalesOrder } from "@/src/domain/entities";
import { computeLine, sumDocument } from "@/src/domain/services/money";
import type {
  ISalesOrderRepository,
  CreateSalesOrderLineInput,
} from "@/src/application/repositories/ISalesOrderRepository";

export interface QuotationLineInput {
  productId: string;
  description: string;
  qtyOrdered: number; // scale QTY_SCALE
  unitPrice: number; // minor
  taxRateBp: number;
}

export interface CreateQuotationInput {
  shopId: string;
  customerId: string;
  currency?: string;
  orderDate: string;
  note?: string | null;
  lines: QuotationLineInput[];
}

/** สร้างใบเสนอราคา (draft) — คำนวณยอดบรรทัด/เอกสารด้วย money service */
export class CreateQuotationUseCase {
  constructor(private readonly salesOrders: ISalesOrderRepository) {}

  async execute(input: CreateQuotationInput): Promise<SalesOrder> {
    if (!input.customerId) throw new Error("กรุณาเลือกลูกค้า");
    if (input.lines.length === 0) throw new Error("ต้องมีอย่างน้อย 1 รายการ");

    const lines: CreateSalesOrderLineInput[] = input.lines.map((l) => {
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
    const doc = sumDocument(
      lines.map((l) => ({ subtotal: l.lineSubtotal, tax: l.lineTax })),
    );

    return this.salesOrders.createWithLines({
      shopId: input.shopId,
      customerId: input.customerId,
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
