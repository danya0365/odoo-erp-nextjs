import type { PurchaseOrder } from "@/src/domain/entities";
import { canReceive, statusAfterReceipt } from "@/src/domain/services/purchase-order-status";
import { canProgress } from "@/src/domain/services/quantity";
import type { IPurchaseOrderRepository } from "@/src/application/repositories/IPurchaseOrderRepository";
import type { IStockMoveRepository, StockMoveInput } from "@/src/application/repositories/IStockMoveRepository";
import type { IStockLocationRepository } from "@/src/application/repositories/IStockLocationRepository";

export interface ReceiveLine {
  lineId: string;
  qty: number;
}

/** บันทึกการรับของ: เขียน stock IN (cross-module) + อัปเดต qtyReceived + สถานะ */
export class ReceivePurchaseOrderUseCase {
  constructor(
    private readonly purchaseOrders: IPurchaseOrderRepository,
    private readonly stockMoves: IStockMoveRepository,
    private readonly locations: IStockLocationRepository,
  ) {}

  async execute(shopId: string, id: string, receipts: ReceiveLine[]): Promise<PurchaseOrder> {
    const order = await this.purchaseOrders.findById(shopId, id);
    if (!order) throw new Error("ไม่พบใบสั่งซื้อ");
    if (!canReceive(order.status)) throw new Error("รับของได้เฉพาะใบสั่งซื้อที่ยืนยันแล้ว");

    const requested = receipts.filter((r) => r.qty > 0);
    if (requested.length === 0) throw new Error("ไม่มีจำนวนที่จะรับ");

    const location = await this.locations.ensureDefault(shopId);
    const moves: StockMoveInput[] = [];
    const lineUpdates: { id: string; qtyReceived: number }[] = [];
    const nextReceived = new Map(order.lines.map((l) => [l.id, l.qtyReceived]));

    for (const r of requested) {
      const line = order.lines.find((l) => l.id === r.lineId);
      if (!line) throw new Error("ไม่พบรายการสินค้าในใบสั่งซื้อ");
      if (!canProgress({ ordered: line.qtyOrdered, done: line.qtyReceived }, r.qty)) {
        throw new Error("จำนวนรับเกินจำนวนที่สั่ง");
      }
      moves.push({
        shopId,
        productId: line.productId,
        locationId: location.id,
        qtyDelta: r.qty, // IN (บวก)
        type: "in",
        sourceType: "receipt",
        sourceId: order.id,
      });
      const received = line.qtyReceived + r.qty;
      nextReceived.set(line.id, received);
      lineUpdates.push({ id: line.id, qtyReceived: received });
    }

    await this.stockMoves.appendMany(moves);
    await this.purchaseOrders.updateLines(shopId, lineUpdates);

    const progress = order.lines.map((l) => ({
      ordered: l.qtyOrdered,
      done: nextReceived.get(l.id) ?? l.qtyReceived,
    }));
    return this.purchaseOrders.update(shopId, id, { status: statusAfterReceipt(progress) });
  }
}
