import type { ManufacturingOrder } from "@/src/domain/entities";
import { canConfirm } from "@/src/domain/services/manufacturing-order-status";
import { formatDocNumber } from "@/src/domain/services/sequence";
import type { IManufacturingOrderRepository } from "@/src/application/repositories/IManufacturingOrderRepository";
import type { ISequenceRepository } from "@/src/application/repositories/ISequenceRepository";

/** ยืนยันใบสั่งผลิต — ออกเลขเอกสาร MO + สถานะ confirmed */
export class ConfirmManufacturingOrderUseCase {
  constructor(
    private readonly orders: IManufacturingOrderRepository,
    private readonly sequences: ISequenceRepository,
  ) {}

  async execute(shopId: string, id: string): Promise<ManufacturingOrder> {
    const order = await this.orders.findById(shopId, id);
    if (!order) throw new Error("ไม่พบใบสั่งผลิต");
    if (!canConfirm(order.status)) throw new Error("ยืนยันได้เฉพาะใบสั่งผลิตที่เป็นร่าง");
    const seq = await this.sequences.next(shopId, "manufacturing_order");
    return this.orders.update(shopId, id, {
      docNumber: formatDocNumber("MO", seq, 5),
      status: "confirmed",
    });
  }
}
