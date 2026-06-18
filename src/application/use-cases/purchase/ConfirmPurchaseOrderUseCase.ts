import type { PurchaseOrder } from "@/src/domain/entities";
import { canConfirm } from "@/src/domain/services/purchase-order-status";
import { formatDocNumber } from "@/src/domain/services/sequence";
import type { IPurchaseOrderRepository } from "@/src/application/repositories/IPurchaseOrderRepository";
import type { ISequenceRepository } from "@/src/application/repositories/ISequenceRepository";

/** ยืนยันใบสั่งซื้อ: ออกเลข POxxxxx + สถานะ confirmed */
export class ConfirmPurchaseOrderUseCase {
  constructor(
    private readonly purchaseOrders: IPurchaseOrderRepository,
    private readonly sequences: ISequenceRepository,
  ) {}

  async execute(shopId: string, id: string, now: string): Promise<PurchaseOrder> {
    const order = await this.purchaseOrders.findById(shopId, id);
    if (!order) throw new Error("ไม่พบใบสั่งซื้อ");
    if (!canConfirm(order.status)) throw new Error("ยืนยันได้เฉพาะใบขอราคา (RFQ)");

    const seq = await this.sequences.next(shopId, "purchase_order");
    return this.purchaseOrders.update(shopId, id, {
      docNumber: formatDocNumber("PO", seq, 5),
      status: "confirmed",
      confirmedAt: now,
    });
  }
}
