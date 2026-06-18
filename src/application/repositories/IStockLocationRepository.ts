import type { StockLocation } from "@/src/domain/entities";

export interface IStockLocationRepository {
  /** หา default ของ shop; ถ้ายังไม่มีให้สร้าง ("คลังหลัก") */
  ensureDefault(shopId: string): Promise<StockLocation>;
  findDefault(shopId: string): Promise<StockLocation | null>;
}
