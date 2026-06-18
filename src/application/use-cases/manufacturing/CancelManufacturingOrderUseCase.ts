import type { ManufacturingOrder } from "@/src/domain/entities";
import { canCancel } from "@/src/domain/services/manufacturing-order-status";
import type { IManufacturingOrderRepository } from "@/src/application/repositories/IManufacturingOrderRepository";

/** ยกเลิกใบสั่งผลิต (เฉพาะ draft/confirmed) */
export class CancelManufacturingOrderUseCase {
  constructor(private readonly orders: IManufacturingOrderRepository) {}

  async execute(shopId: string, id: string): Promise<ManufacturingOrder> {
    const order = await this.orders.findById(shopId, id);
    if (!order) throw new Error("ไม่พบใบสั่งผลิต");
    if (!canCancel(order.status)) throw new Error("ยกเลิกได้เฉพาะใบสั่งผลิตที่ยังไม่ผลิต");
    return this.orders.update(shopId, id, { status: "cancelled" });
  }
}
