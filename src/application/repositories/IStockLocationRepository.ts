import type { StockLocation } from "@/src/domain/entities";

export interface IStockLocationRepository {
  /** หา default ของ shop; ถ้ายังไม่มีให้สร้าง ("คลังหลัก") */
  ensureDefault(shopId: string): Promise<StockLocation>;
  findDefault(shopId: string): Promise<StockLocation | null>;
  list(shopId: string): Promise<StockLocation[]>;
  findById(shopId: string, id: string): Promise<StockLocation | null>;
  create(shopId: string, name: string): Promise<StockLocation>;
}
