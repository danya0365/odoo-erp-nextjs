import type { VendorBill } from "@/src/domain/entities";
import { canBill } from "@/src/domain/services/purchase-order-status";
import { formatDocNumber } from "@/src/domain/services/sequence";
import type { IPurchaseOrderRepository } from "@/src/application/repositories/IPurchaseOrderRepository";
import type { IVendorBillRepository } from "@/src/application/repositories/IVendorBillRepository";
import type { ISequenceRepository } from "@/src/application/repositories/ISequenceRepository";

/** ตั้งหนี้ผู้ขายจากใบสั่งซื้อที่รับครบ — bill ตามจำนวนที่สั่ง + สถานะ billed */
export class CreateVendorBillUseCase {
  constructor(
    private readonly purchaseOrders: IPurchaseOrderRepository,
    private readonly vendorBills: IVendorBillRepository,
    private readonly sequences: ISequenceRepository,
  ) {}

  async execute(shopId: string, id: string): Promise<VendorBill> {
    const order = await this.purchaseOrders.findById(shopId, id);
    if (!order) throw new Error("ไม่พบใบสั่งซื้อ");
    if (!canBill(order.status)) throw new Error("ตั้งหนี้ได้เฉพาะใบสั่งซื้อที่รับครบแล้ว");

    const seq = await this.sequences.next(shopId, "vendor_bill");
    const bill = await this.vendorBills.createWithLines({
      shopId,
      docNumber: formatDocNumber("BILL", seq, 5),
      purchaseOrderId: order.id,
      vendorId: order.vendorId,
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

    await this.purchaseOrders.updateLines(
      shopId,
      order.lines.map((l) => ({ id: l.id, qtyBilled: l.qtyOrdered })),
    );
    await this.purchaseOrders.update(shopId, id, { status: "billed" });
    return bill;
  }
}
