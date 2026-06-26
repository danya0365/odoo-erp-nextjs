import type { StockCount } from "@/src/domain/entities";
import { formatDocNumber } from "@/src/domain/services/sequence";
import type { IStockCountRepository } from "@/src/application/repositories/IStockCountRepository";
import type { IProductRepository } from "@/src/application/repositories/IProductRepository";
import type { IStockMoveRepository } from "@/src/application/repositories/IStockMoveRepository";
import type { ISequenceRepository } from "@/src/application/repositories/ISequenceRepository";

/** เปิดรอบตรวจนับ: snapshot on-hand ปัจจุบันของสินค้า stockable ทุกตัว (counted = system เป็นค่าเริ่ม) */
export class CreateStockCountUseCase {
  constructor(
    private readonly stockCounts: IStockCountRepository,
    private readonly products: IProductRepository,
    private readonly stockMoves: IStockMoveRepository,
    private readonly sequences: ISequenceRepository,
  ) {}

  async execute(shopId: string, note: string | null): Promise<StockCount> {
    const page = await this.products.list(shopId, { page: 1, pageSize: 1000, status: "" });
    const stockable = page.items.filter((p) => p.isActive && p.type === "stockable");
    const onHand = new Map((await this.stockMoves.onHandList(shopId)).map((r) => [r.productId, r.onHand]));

    const lines = stockable.map((p) => {
      const sys = onHand.get(p.id) ?? 0;
      return { productId: p.id, systemQty: sys, countedQty: sys };
    });

    const seq = await this.sequences.next(shopId, "stock_count");
    return this.stockCounts.createWithLines({
      shopId,
      docNumber: formatDocNumber("SC", seq, 5),
      note,
      lines,
    });
  }
}
