import type { ManufacturingOrder } from "@/src/domain/entities";
import { canProduce } from "@/src/domain/services/manufacturing-order-status";
import {
  componentRequirement,
  hasComponentsAvailable,
  type ComponentAvailability,
} from "@/src/domain/services/manufacturing";
import type { IManufacturingOrderRepository } from "@/src/application/repositories/IManufacturingOrderRepository";
import type { IBomRepository } from "@/src/application/repositories/IBomRepository";
import type { IStockMoveRepository, StockMoveInput } from "@/src/application/repositories/IStockMoveRepository";
import type { IStockLocationRepository } from "@/src/application/repositories/IStockLocationRepository";

/**
 * ผลิต (cross-module): ตัดวัตถุดิบ (OUT) ตามสูตร × จำนวน + รับสินค้าสำเร็จรูป (IN)
 * ทั้งหมดเป็น stock move ชุดเดียว (atomic) — กันผลิตถ้าวัตถุดิบไม่พอ
 */
export class ProduceManufacturingOrderUseCase {
  constructor(
    private readonly orders: IManufacturingOrderRepository,
    private readonly boms: IBomRepository,
    private readonly stockMoves: IStockMoveRepository,
    private readonly locations: IStockLocationRepository,
  ) {}

  async execute(shopId: string, id: string): Promise<ManufacturingOrder> {
    const order = await this.orders.findById(shopId, id);
    if (!order) throw new Error("ไม่พบใบสั่งผลิต");
    if (!canProduce(order.status)) throw new Error("ผลิตได้เฉพาะใบสั่งผลิตที่ยืนยันแล้ว");

    const bom = await this.boms.findById(shopId, order.bomId);
    if (!bom) throw new Error("ไม่พบสูตรการผลิต");

    // คำนวณวัตถุดิบที่ต้องใช้ + ตรวจความพร้อม
    const requirements = bom.lines.map((l) => ({
      componentId: l.componentId,
      required: componentRequirement(l.qtyPerUnit, order.qty),
    }));
    const availability: ComponentAvailability[] = [];
    for (const r of requirements) {
      const onHand = await this.stockMoves.onHandByProduct(shopId, r.componentId);
      availability.push({ required: r.required, onHand });
    }
    if (!hasComponentsAvailable(availability)) {
      throw new Error("วัตถุดิบไม่พอสำหรับการผลิต");
    }

    const location = await this.locations.ensureDefault(shopId);
    const moves: StockMoveInput[] = requirements.map((r) => ({
      shopId,
      productId: r.componentId,
      locationId: location.id,
      qtyDelta: -r.required, // ตัดวัตถุดิบ
      type: "out",
      sourceType: "manufacturing",
      sourceId: order.id,
    }));
    moves.push({
      shopId,
      productId: order.productId,
      locationId: location.id,
      qtyDelta: order.qty, // รับสินค้าสำเร็จรูป
      type: "in",
      sourceType: "manufacturing",
      sourceId: order.id,
    });

    await this.stockMoves.appendMany(moves);
    return this.orders.update(shopId, id, { status: "done" });
  }
}
