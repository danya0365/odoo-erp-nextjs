import type { SalesReturn } from "@/src/domain/entities";
import { computeLine, sumDocument } from "@/src/domain/services/money";
import { formatDocNumber } from "@/src/domain/services/sequence";
import type { IInvoiceRepository } from "@/src/application/repositories/IInvoiceRepository";
import type { ISalesReturnRepository } from "@/src/application/repositories/ISalesReturnRepository";
import type { ISequenceRepository } from "@/src/application/repositories/ISequenceRepository";

export interface ReturnLineInput {
  invoiceLineId: string;
  qty: number; // scale QTY_SCALE
}

/** สร้างคำขอคืนสินค้า (draft) จากใบแจ้งหนี้เดิม — snapshot ราคา/ภาษีจากบรรทัดใบแจ้งหนี้ (ไม่เชื่อ client) */
export class CreateSalesReturnUseCase {
  constructor(
    private readonly salesReturns: ISalesReturnRepository,
    private readonly invoices: IInvoiceRepository,
    private readonly sequences: ISequenceRepository,
  ) {}

  async execute(
    shopId: string,
    invoiceId: string,
    lines: ReturnLineInput[],
    reason: string | null,
  ): Promise<SalesReturn> {
    const invoice = await this.invoices.findById(shopId, invoiceId);
    if (!invoice) throw new Error("ไม่พบใบแจ้งหนี้");
    if (invoice.status === "cancelled") throw new Error("ใบแจ้งหนี้นี้ถูกยกเลิกแล้ว");

    const invoiceLines = await this.invoices.listLines(shopId, invoiceId);
    const requested = lines.filter((l) => l.qty > 0);
    if (requested.length === 0) throw new Error("ไม่มีจำนวนที่จะคืน");

    const returnLines = requested.map((r) => {
      const il = invoiceLines.find((l) => l.id === r.invoiceLineId);
      if (!il) throw new Error("ไม่พบรายการในใบแจ้งหนี้");
      if (r.qty > il.qty) throw new Error("จำนวนคืนเกินจำนวนในใบแจ้งหนี้");
      const c = computeLine(r.qty, il.unitPrice, il.taxRateBp);
      return {
        productId: il.productId,
        description: il.description,
        qty: r.qty,
        unitPrice: il.unitPrice,
        taxRateBp: il.taxRateBp,
        lineSubtotal: c.subtotal,
        lineTax: c.tax,
        lineTotal: c.total,
      };
    });

    const totals = sumDocument(returnLines.map((l) => ({ subtotal: l.lineSubtotal, tax: l.lineTax })));
    const seq = await this.sequences.next(shopId, "credit_note");

    return this.salesReturns.createWithLines({
      shopId,
      docNumber: formatDocNumber("CN", seq, 5),
      invoiceId: invoice.id,
      salesOrderId: invoice.salesOrderId,
      customerId: invoice.customerId,
      status: "draft",
      currency: invoice.currency,
      untaxedAmount: totals.untaxed,
      taxAmount: totals.tax,
      totalAmount: totals.total,
      reason,
      lines: returnLines,
    });
  }
}
