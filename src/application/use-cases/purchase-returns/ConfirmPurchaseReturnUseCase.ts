import type { PurchaseReturn } from "@/src/domain/entities";
import { canConfirm } from "@/src/domain/services/purchase-return-status";
import type { IPurchaseReturnRepository } from "@/src/application/repositories/IPurchaseReturnRepository";
import type { IStockMoveRepository, StockMoveInput } from "@/src/application/repositories/IStockMoveRepository";
import type { IStockLocationRepository } from "@/src/application/repositories/IStockLocationRepository";

/** ยืนยันคืนผู้ขาย: ส่งของกลับ (stock OUT) + สถานะ credited (พร้อมออกใบลดหนี้ผู้ขาย) */
export class ConfirmPurchaseReturnUseCase {
  constructor(
    private readonly returns: IPurchaseReturnRepository,
    private readonly stockMoves: IStockMoveRepository,
    private readonly locations: IStockLocationRepository,
  ) {}

  async execute(shopId: string, id: string): Promise<PurchaseReturn> {
    const ret = await this.returns.findById(shopId, id);
    if (!ret) throw new Error("ไม่พบใบคืนของผู้ขาย");
    if (!canConfirm(ret.status)) throw new Error("ยืนยันได้เฉพาะใบคืนที่เป็นร่าง");

    const location = await this.locations.ensureDefault(shopId);
    const moves: StockMoveInput[] = ret.lines.map((l) => ({
      shopId,
      productId: l.productId,
      locationId: location.id,
      qtyDelta: -l.qty, // OUT — ของออกไปคืนผู้ขาย
      type: "out",
      sourceType: "purchase_return",
      sourceId: ret.id,
    }));
    await this.stockMoves.appendMany(moves);

    return this.returns.update(shopId, id, { status: "credited" });
  }
}
