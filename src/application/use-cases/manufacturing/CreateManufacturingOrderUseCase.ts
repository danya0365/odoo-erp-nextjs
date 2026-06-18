import type { ManufacturingOrder } from "@/src/domain/entities";
import type { IBomRepository } from "@/src/application/repositories/IBomRepository";
import type { IManufacturingOrderRepository } from "@/src/application/repositories/IManufacturingOrderRepository";

/** สร้างใบสั่งผลิต (draft) จากสูตร — snapshot สินค้าสำเร็จรูปจาก BOM */
export class CreateManufacturingOrderUseCase {
  constructor(
    private readonly boms: IBomRepository,
    private readonly orders: IManufacturingOrderRepository,
  ) {}

  async execute(shopId: string, bomId: string, qty: number): Promise<ManufacturingOrder> {
    if (qty <= 0) throw new Error("จำนวนที่จะผลิตต้องมากกว่า 0");
    const bom = await this.boms.findById(shopId, bomId);
    if (!bom) throw new Error("ไม่พบสูตรการผลิต");
    return this.orders.create({ shopId, bomId, productId: bom.productId, qty });
  }
}
