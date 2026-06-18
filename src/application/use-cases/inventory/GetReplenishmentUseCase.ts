import { reorderSuggestion } from "@/src/domain/services/stock";
import type { IReorderRuleRepository } from "@/src/application/repositories/IReorderRuleRepository";
import type { IStockMoveRepository } from "@/src/application/repositories/IStockMoveRepository";
import type { IProductRepository } from "@/src/application/repositories/IProductRepository";

export interface ReorderRow {
  productId: string;
  name: string;
  sku: string;
  onHand: number;
  minQty: number;
  maxQty: number;
  suggestion: number;
  hasRule: boolean;
}

export interface ReplenishmentResult {
  rows: ReorderRow[];
  toReorder: number; // จำนวนสินค้าที่ควรเติม
}

/** รวมสินค้า stockable + กฎ + on-hand → คำนวณปริมาณที่ควรเติม */
export class GetReplenishmentUseCase {
  constructor(
    private readonly reorderRules: IReorderRuleRepository,
    private readonly stockMoves: IStockMoveRepository,
    private readonly products: IProductRepository,
  ) {}

  async execute(shopId: string): Promise<ReplenishmentResult> {
    const [page, rules, onHandRows] = await Promise.all([
      this.products.list(shopId, { page: 1, pageSize: 100, status: "" }),
      this.reorderRules.list(shopId),
      this.stockMoves.onHandList(shopId),
    ]);
    const ruleMap = new Map(rules.map((r) => [r.productId, r]));
    const onHandMap = new Map(onHandRows.map((r) => [r.productId, r.onHand]));

    const rows: ReorderRow[] = page.items
      .filter((p) => p.type === "stockable")
      .map((p) => {
        const rule = ruleMap.get(p.id);
        const minQty = rule?.minQty ?? 0;
        const maxQty = rule?.maxQty ?? 0;
        const onHand = onHandMap.get(p.id) ?? 0;
        return {
          productId: p.id,
          name: p.name,
          sku: p.sku,
          onHand,
          minQty,
          maxQty,
          suggestion: rule ? reorderSuggestion(onHand, minQty, maxQty) : 0,
          hasRule: Boolean(rule),
        };
      });

    return { rows, toReorder: rows.filter((r) => r.suggestion > 0).length };
  }
}
