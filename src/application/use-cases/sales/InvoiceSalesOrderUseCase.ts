import type { Invoice } from "@/src/domain/entities";
import { canInvoice } from "@/src/domain/services/sales-order-status";
import { formatDocNumber } from "@/src/domain/services/sequence";
import type { ISalesOrderRepository } from "@/src/application/repositories/ISalesOrderRepository";
import type { IInvoiceRepository } from "@/src/application/repositories/IInvoiceRepository";
import type { ISequenceRepository } from "@/src/application/repositories/ISequenceRepository";

/** ออกใบแจ้งหนี้จากใบขายที่ส่งครบ — invoice ตามจำนวนที่สั่ง + อัปเดตสถานะ invoiced */
export class InvoiceSalesOrderUseCase {
  constructor(
    private readonly salesOrders: ISalesOrderRepository,
    private readonly invoices: IInvoiceRepository,
    private readonly sequences: ISequenceRepository,
  ) {}

  async execute(shopId: string, id: string): Promise<Invoice> {
    const order = await this.salesOrders.findById(shopId, id);
    if (!order) throw new Error("ไม่พบใบขาย");
    if (!canInvoice(order.status)) throw new Error("ออกใบแจ้งหนี้ได้เฉพาะใบขายที่ส่งครบแล้ว");

    const seq = await this.sequences.next(shopId, "invoice");
    const invoice = await this.invoices.createWithLines({
      shopId,
      docNumber: formatDocNumber("INV", seq, 5),
      salesOrderId: order.id,
      customerId: order.customerId,
      status: "posted",
      currency: order.currency,
      untaxedAmount: order.untaxedAmount,
      taxAmount: order.taxAmount,
      totalAmount: order.totalAmount,
      lines: order.lines.map((l) => ({
        productId: l.productId,
        description: l.description,
        qty: l.qtyOrdered,
        unitPrice: l.unitPrice,
        taxRateBp: l.taxRateBp,
        lineSubtotal: l.lineSubtotal,
        lineTax: l.lineTax,
        lineTotal: l.lineTotal,
      })),
    });

    await this.salesOrders.updateLines(
      shopId,
      order.lines.map((l) => ({ id: l.id, qtyInvoiced: l.qtyOrdered })),
    );
    await this.salesOrders.update(shopId, id, { status: "invoiced" });
    return invoice;
  }
}
