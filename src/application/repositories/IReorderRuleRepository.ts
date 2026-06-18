import type { ReorderRule } from "@/src/domain/entities";

export interface IReorderRuleRepository {
  /** ตั้ง/อัปเดตกฎต่อสินค้า (upsert ตาม shopId+productId) */
  upsert(shopId: string, productId: string, minQty: number, maxQty: number): Promise<ReorderRule>;
  list(shopId: string): Promise<ReorderRule[]>;
  findByProduct(shopId: string, productId: string): Promise<ReorderRule | null>;
}
