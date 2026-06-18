import { canTransfer } from "@/src/domain/services/stock";
import type { IStockLocationRepository } from "@/src/application/repositories/IStockLocationRepository";
import type { IStockMoveRepository } from "@/src/application/repositories/IStockMoveRepository";

export interface TransferInput {
  shopId: string;
  productId: string;
  fromLocationId: string;
  toLocationId: string;
  qty: number; // scale QTY_SCALE
}

/**
 * โอนสต๊อกระหว่างคลัง (cross-location) — เขียน 2 move คู่กันแบบ atomic:
 * OUT ที่ต้นทาง (−qty) + IN ที่ปลายทาง (+qty). on-hand รวมทั้ง shop ไม่เปลี่ยน
 */
export class TransferStockUseCase {
  constructor(
    private readonly locations: IStockLocationRepository,
    private readonly stockMoves: IStockMoveRepository,
  ) {}

  async execute(input: TransferInput): Promise<void> {
    const { shopId, productId, fromLocationId, toLocationId, qty } = input;
    if (fromLocationId === toLocationId) throw new Error("คลังต้นทางและปลายทางต้องต่างกัน");

    const [from, to] = await Promise.all([
      this.locations.findById(shopId, fromLocationId),
      this.locations.findById(shopId, toLocationId),
    ]);
    if (!from || !to) throw new Error("ไม่พบคลังสินค้า");

    const sourceOnHand = await this.stockMoves.onHandByProductAndLocation(
      shopId,
      productId,
      fromLocationId,
    );
    if (!canTransfer(sourceOnHand, qty)) {
      throw new Error("จำนวนโอนเกินยอดคงเหลือในคลังต้นทาง");
    }

    await this.stockMoves.appendMany([
      {
        shopId, productId, locationId: fromLocationId, qtyDelta: -qty,
        type: "out", sourceType: "transfer", sourceId: toLocationId,
        note: `โอนไป ${to.name}`,
      },
      {
        shopId, productId, locationId: toLocationId, qtyDelta: qty,
        type: "in", sourceType: "transfer", sourceId: fromLocationId,
        note: `รับจาก ${from.name}`,
      },
    ]);
  }
}
