import { canApplyDelta } from "@/src/domain/services/stock";
import type { IProductRepository } from "@/src/application/repositories/IProductRepository";
import type { IStockMoveRepository } from "@/src/application/repositories/IStockMoveRepository";
import type { IStockLocationRepository } from "@/src/application/repositories/IStockLocationRepository";

export interface AdjustStockInput {
  shopId: string;
  productId: string;
  qtyDelta: number; // signed, scale QTY_SCALE
  note?: string | null;
}

/** ปรับสต๊อกด้วยการ append move ชนิด adjust — กันสต๊อกติดลบ. คืน on-hand ใหม่ */
export class AdjustStockUseCase {
  constructor(
    private readonly products: IProductRepository,
    private readonly stockMoves: IStockMoveRepository,
    private readonly locations: IStockLocationRepository,
  ) {}

  async execute(input: AdjustStockInput): Promise<number> {
    const { shopId, productId, qtyDelta } = input;
    if (qtyDelta === 0) throw new Error("จำนวนต้องไม่เป็นศูนย์");

    const product = await this.products.findById(shopId, productId);
    if (!product) throw new Error("ไม่พบสินค้า");
    if (product.type !== "stockable") {
      throw new Error("ปรับสต๊อกได้เฉพาะสินค้าประเภทนับสต๊อก");
    }

    const onHand = await this.stockMoves.onHandByProduct(shopId, productId);
    if (!canApplyDelta(onHand, qtyDelta)) {
      throw new Error("สต๊อกไม่พอ (จะติดลบ)");
    }

    const location = await this.locations.ensureDefault(shopId);
    await this.stockMoves.appendMany([
      {
        shopId,
        productId,
        locationId: location.id,
        qtyDelta,
        type: "adjust",
        sourceType: "adjustment",
        note: input.note ?? null,
      },
    ]);
    return onHand + qtyDelta;
  }
}
