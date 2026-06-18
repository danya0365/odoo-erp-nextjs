import type { SalesOrder } from "@/src/domain/entities";
import { canConfirm } from "@/src/domain/services/sales-order-status";
import { formatDocNumber } from "@/src/domain/services/sequence";
import type { ISalesOrderRepository } from "@/src/application/repositories/ISalesOrderRepository";
import type { ISequenceRepository } from "@/src/application/repositories/ISequenceRepository";

/** ยืนยันใบขาย: ออกเลขเอกสาร (SOxxxxx) + เปลี่ยนสถานะ confirmed */
export class ConfirmSalesOrderUseCase {
  constructor(
    private readonly salesOrders: ISalesOrderRepository,
    private readonly sequences: ISequenceRepository,
  ) {}

  async execute(shopId: string, id: string, now: string): Promise<SalesOrder> {
    const order = await this.salesOrders.findById(shopId, id);
    if (!order) throw new Error("ไม่พบใบขาย");
    if (!canConfirm(order.status)) throw new Error("ยืนยันได้เฉพาะใบขายสถานะร่าง");

    const seq = await this.sequences.next(shopId, "sales_order");
    return this.salesOrders.update(shopId, id, {
      docNumber: formatDocNumber("SO", seq, 5),
      status: "confirmed",
      confirmedAt: now,
    });
  }
}
