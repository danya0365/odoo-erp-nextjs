import type { SalesOrder } from "@/src/domain/entities";
import { canCancel } from "@/src/domain/services/sales-order-status";
import type { ISalesOrderRepository } from "@/src/application/repositories/ISalesOrderRepository";

export class CancelSalesOrderUseCase {
  constructor(private readonly salesOrders: ISalesOrderRepository) {}

  async execute(shopId: string, id: string): Promise<SalesOrder> {
    const order = await this.salesOrders.findById(shopId, id);
    if (!order) throw new Error("ไม่พบใบขาย");
    if (!canCancel(order.status)) throw new Error("ยกเลิกได้เฉพาะใบขายสถานะร่าง/ยืนยันแล้ว");
    return this.salesOrders.update(shopId, id, { status: "cancelled" });
  }
}
