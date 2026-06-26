import type { StockCount } from "@/src/domain/entities";
import type { IStockCountRepository } from "@/src/application/repositories/IStockCountRepository";
import type { IStockMoveRepository, StockMoveInput } from "@/src/application/repositories/IStockMoveRepository";
import type { IStockLocationRepository } from "@/src/application/repositories/IStockLocationRepository";

export interface CountInput {
  lineId: string;
  countedQty: number; // scale QTY_SCALE
}

/** ยืนยันผลนับ: บันทึก countedQty + ปรับสต๊อกตามส่วนต่าง (variance = นับ − on-hand ปัจจุบัน) */
export class ApplyStockCountUseCase {
  constructor(
    private readonly stockCounts: IStockCountRepository,
    private readonly stockMoves: IStockMoveRepository,
    private readonly locations: IStockLocationRepository,
  ) {}

  async execute(shopId: string, id: string, counts: CountInput[]): Promise<StockCount> {
    const sc = await this.stockCounts.findById(shopId, id);
    if (!sc) throw new Error("ไม่พบรอบตรวจนับ");
    if (sc.status !== "draft") throw new Error("ปรับสต๊อกได้เฉพาะรอบที่ยังไม่ยืนยัน");

    // บันทึกจำนวนที่นับได้ก่อน
    const countMap = new Map(counts.map((c) => [c.lineId, c.countedQty]));
    await this.stockCounts.updateLineCounts(
      shopId,
      sc.lines.map((l) => ({ id: l.id, countedQty: countMap.get(l.id) ?? l.countedQty })),
    );

    const location = await this.locations.ensureDefault(shopId);
    const moves: StockMoveInput[] = [];
    for (const line of sc.lines) {
      const counted = countMap.get(line.id) ?? line.countedQty;
      const onHand = await this.stockMoves.onHandByProduct(shopId, line.productId);
      const variance = counted - onHand;
      if (variance === 0) continue;
      moves.push({
        shopId,
        productId: line.productId,
        locationId: location.id,
        qtyDelta: variance, // +เกิน / −ขาด
        type: "adjust",
        sourceType: "stocktake",
        sourceId: sc.id,
      });
    }
    if (moves.length > 0) await this.stockMoves.appendMany(moves);

    return this.stockCounts.update(shopId, id, { status: "applied" });
  }
}
