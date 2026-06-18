import type { ReorderRule } from "@/src/domain/entities";
import type { IReorderRuleRepository } from "@/src/application/repositories/IReorderRuleRepository";
import type { IProductRepository } from "@/src/application/repositories/IProductRepository";

/** ตั้งจุดสั่งซื้อซ้ำต่อสินค้า (min/max) */
export class SetReorderRuleUseCase {
  constructor(
    private readonly reorderRules: IReorderRuleRepository,
    private readonly products: IProductRepository,
  ) {}

  async execute(
    shopId: string,
    productId: string,
    minQty: number,
    maxQty: number,
  ): Promise<ReorderRule> {
    if (minQty < 0 || maxQty < 0) throw new Error("จำนวนต้องไม่ติดลบ");
    if (maxQty < minQty) throw new Error("จำนวนสูงสุดต้องไม่น้อยกว่าขั้นต่ำ");
    const product = await this.products.findById(shopId, productId);
    if (!product) throw new Error("ไม่พบสินค้า");
    return this.reorderRules.upsert(shopId, productId, minQty, maxQty);
  }
}
