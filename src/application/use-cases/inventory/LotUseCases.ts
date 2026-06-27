import type { ProductLot } from "@/src/domain/entities";
import { allocateFefo, type Allocation } from "@/src/domain/services/lot";
import type { IProductLotRepository } from "@/src/application/repositories/IProductLotRepository";
import type { IProductRepository } from "@/src/application/repositories/IProductRepository";

/** รับสินค้าเข้าระบุล็อต + วันหมดอายุ */
export class ReceiveLotUseCase {
  constructor(
    private readonly lots: IProductLotRepository,
    private readonly products: IProductRepository,
  ) {}
  async execute(shopId: string, productId: string, lotNumber: string, expiryDate: string, qty: number): Promise<ProductLot> {
    const product = await this.products.findById(shopId, productId);
    if (!product) throw new Error("ไม่พบสินค้า");
    if (qty <= 0) throw new Error("จำนวนต้องมากกว่า 0");
    if (!expiryDate) throw new Error("กรุณาระบุวันหมดอายุ");
    return this.lots.create({ shopId, productId, lotNumber, expiryDate, qty });
  }
}

/** ตัดสต๊อกแบบ FEFO — เลือกล็อตหมดอายุก่อน แล้วลดจำนวน */
export class AllocateFefoUseCase {
  constructor(private readonly lots: IProductLotRepository) {}
  async execute(shopId: string, productId: string, qty: number): Promise<Allocation[]> {
    const available = await this.lots.listByProduct(shopId, productId);
    const allocations = allocateFefo(available.map((l) => ({ id: l.id, expiryDate: l.expiryDate, qty: l.qty })), qty);
    for (const a of allocations) {
      const lot = available.find((l) => l.id === a.lotId)!;
      await this.lots.setQty(shopId, a.lotId, lot.qty - a.qty);
    }
    return allocations;
  }
}
