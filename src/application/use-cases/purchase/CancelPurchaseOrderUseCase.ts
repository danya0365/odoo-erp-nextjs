import type { PurchaseOrder } from "@/src/domain/entities";
import { canCancel } from "@/src/domain/services/purchase-order-status";
import type { IPurchaseOrderRepository } from "@/src/application/repositories/IPurchaseOrderRepository";

export class CancelPurchaseOrderUseCase {
  constructor(private readonly purchaseOrders: IPurchaseOrderRepository) {}

  async execute(shopId: string, id: string): Promise<PurchaseOrder> {
    const order = await this.purchaseOrders.findById(shopId, id);
    if (!order) throw new Error("ไม่พบใบสั่งซื้อ");
    if (!canCancel(order.status)) throw new Error("ยกเลิกได้เฉพาะ RFQ/ยืนยันแล้ว");
    return this.purchaseOrders.update(shopId, id, { status: "cancelled" });
  }
}
