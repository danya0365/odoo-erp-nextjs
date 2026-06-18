import type { StockLocation } from "@/src/domain/entities";
import type { IStockLocationRepository } from "@/src/application/repositories/IStockLocationRepository";

/** สร้างคลังสินค้าเพิ่ม (นอกเหนือคลังหลัก) */
export class CreateLocationUseCase {
  constructor(private readonly locations: IStockLocationRepository) {}

  async execute(shopId: string, name: string): Promise<StockLocation> {
    const trimmed = name.trim();
    if (!trimmed) throw new Error("กรุณาระบุชื่อคลัง");
    return this.locations.create(shopId, trimmed);
  }
}
