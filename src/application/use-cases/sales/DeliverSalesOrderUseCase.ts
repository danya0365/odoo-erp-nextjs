import type { SalesOrder } from "@/src/domain/entities";
import { canDeliver, statusAfterDelivery } from "@/src/domain/services/sales-order-status";
import { canProgress } from "@/src/domain/services/quantity";
import type { ISalesOrderRepository } from "@/src/application/repositories/ISalesOrderRepository";
import type { IStockMoveRepository, StockMoveInput } from "@/src/application/repositories/IStockMoveRepository";
import type { IStockLocationRepository } from "@/src/application/repositories/IStockLocationRepository";

export interface DeliverLine {
  lineId: string;
  qty: number; // scale QTY_SCALE
}

/** บันทึกการส่งของ: เขียน stock OUT (cross-module) + อัปเดต qtyDelivered + สถานะ */
export class DeliverSalesOrderUseCase {
  constructor(
    private readonly salesOrders: ISalesOrderRepository,
    private readonly stockMoves: IStockMoveRepository,
    private readonly locations: IStockLocationRepository,
  ) {}

  async execute(shopId: string, id: string, deliveries: DeliverLine[]): Promise<SalesOrder> {
    const order = await this.salesOrders.findById(shopId, id);
    if (!order) throw new Error("ไม่พบใบขาย");
    if (!canDeliver(order.status)) throw new Error("ส่งของได้เฉพาะใบขายที่ยืนยันแล้ว");

    const requested = deliveries.filter((d) => d.qty > 0);
    if (requested.length === 0) throw new Error("ไม่มีจำนวนที่จะส่ง");

    const location = await this.locations.ensureDefault(shopId);
    const moves: StockMoveInput[] = [];
    const lineUpdates: { id: string; qtyDelivered: number }[] = [];
    const nextDelivered = new Map(order.lines.map((l) => [l.id, l.qtyDelivered]));

    for (const d of requested) {
      const line = order.lines.find((l) => l.id === d.lineId);
      if (!line) throw new Error("ไม่พบรายการสินค้าในใบขาย");
      if (!canProgress({ ordered: line.qtyOrdered, done: line.qtyDelivered }, d.qty)) {
        throw new Error("จำนวนส่งเกินจำนวนที่สั่ง");
      }
      moves.push({
        shopId,
        productId: line.productId,
        locationId: location.id,
        qtyDelta: -d.qty, // OUT
        type: "out",
        sourceType: "delivery",
        sourceId: order.id,
      });
      const delivered = line.qtyDelivered + d.qty;
      nextDelivered.set(line.id, delivered);
      lineUpdates.push({ id: line.id, qtyDelivered: delivered });
    }

    await this.stockMoves.appendMany(moves);
    await this.salesOrders.updateLines(shopId, lineUpdates);

    const progress = order.lines.map((l) => ({
      ordered: l.qtyOrdered,
      done: nextDelivered.get(l.id) ?? l.qtyDelivered,
    }));
    return this.salesOrders.update(shopId, id, { status: statusAfterDelivery(progress) });
  }
}
