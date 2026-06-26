import type { SalesReturn } from "@/src/domain/entities";
import { canConfirm } from "@/src/domain/services/sales-return-status";
import type { ISalesReturnRepository } from "@/src/application/repositories/ISalesReturnRepository";
import type { IStockMoveRepository, StockMoveInput } from "@/src/application/repositories/IStockMoveRepository";
import type { IStockLocationRepository } from "@/src/application/repositories/IStockLocationRepository";

/** ยืนยันคืน: รับของกลับเข้าสต๊อก (stock IN, cross-module) + สถานะ credited (พร้อมออกใบลดหนี้) */
export class ConfirmSalesReturnUseCase {
  constructor(
    private readonly salesReturns: ISalesReturnRepository,
    private readonly stockMoves: IStockMoveRepository,
    private readonly locations: IStockLocationRepository,
  ) {}

  async execute(shopId: string, id: string): Promise<SalesReturn> {
    const ret = await this.salesReturns.findById(shopId, id);
    if (!ret) throw new Error("ไม่พบใบคืนสินค้า");
    if (!canConfirm(ret.status)) throw new Error("ยืนยันได้เฉพาะใบคืนที่เป็นร่าง");

    const location = await this.locations.ensureDefault(shopId);
    const moves: StockMoveInput[] = ret.lines.map((l) => ({
      shopId,
      productId: l.productId,
      locationId: location.id,
      qtyDelta: l.qty, // IN (บวก) — ของกลับเข้าคลัง
      type: "in",
      sourceType: "sales_return",
      sourceId: ret.id,
    }));
    await this.stockMoves.appendMany(moves);

    return this.salesReturns.update(shopId, id, { status: "credited" });
  }
}
