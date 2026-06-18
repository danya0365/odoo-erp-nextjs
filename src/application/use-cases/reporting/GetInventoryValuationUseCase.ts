import { inventoryLineValue, topN, sumBy } from "@/src/domain/services/reporting";
import type { IReportingRepository } from "@/src/application/repositories/IReportingRepository";

export interface ValuationItem {
  productId: string;
  name: string;
  onHand: number;
  unitCost: number;
  value: number; // minor
}

export interface InventoryValuationResult {
  items: ValuationItem[];
  totalValue: number;
  outOfStock: number; // จำนวนสินค้า on-hand ≤ 0
}

/** ตีมูลค่าสินค้าคงคลัง = on-hand × ต้นทุน, เรียงมูลค่ามาก→น้อย */
export class GetInventoryValuationUseCase {
  constructor(private readonly reporting: IReportingRepository) {}

  async execute(shopId: string): Promise<InventoryValuationResult> {
    const rows = await this.reporting.inventoryValuation(shopId);
    const valued = rows.map((r) => ({
      ...r,
      value: inventoryLineValue(r.onHand, r.unitCost),
    }));
    const items = topN(valued, (i) => i.value, valued.length);
    return {
      items,
      totalValue: sumBy(items, (i) => i.value),
      outOfStock: items.filter((i) => i.onHand <= 0).length,
    };
  }
}
