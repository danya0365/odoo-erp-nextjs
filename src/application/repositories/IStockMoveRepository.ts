import type { StockMove, StockMoveType, StockSourceType } from "@/src/domain/entities";

export interface StockMoveInput {
  shopId: string;
  productId: string;
  locationId: string;
  qtyDelta: number; // signed, scale QTY_SCALE
  type: StockMoveType;
  sourceType: StockSourceType;
  sourceId?: string | null;
  note?: string | null;
}

export interface OnHandRow {
  productId: string;
  onHand: number; // scale QTY_SCALE
}

export interface OnHandLocationRow {
  productId: string;
  locationId: string;
  onHand: number; // scale QTY_SCALE
}

export interface IStockMoveRepository {
  appendMany(moves: StockMoveInput[]): Promise<StockMove[]>;
  /** on-hand ของสินค้าหนึ่งตัว = SUM(qtyDelta) */
  onHandByProduct(shopId: string, productId: string): Promise<number>;
  /** on-hand ของสินค้าหนึ่งตัวในคลังหนึ่ง */
  onHandByProductAndLocation(shopId: string, productId: string, locationId: string): Promise<number>;
  /** on-hand ทุกสินค้าใน shop */
  onHandList(shopId: string): Promise<OnHandRow[]>;
  /** on-hand แยกตามคลัง (สำหรับมุมมองหลายคลัง) */
  onHandByLocationList(shopId: string): Promise<OnHandLocationRow[]>;
  /** ledger ของสินค้าหนึ่งตัว (ใหม่สุดก่อน) */
  listByProduct(shopId: string, productId: string, limit?: number): Promise<StockMove[]>;
  /** ledger ตามประเภทที่มา (เช่น transfer) ใหม่สุดก่อน */
  listBySourceType(shopId: string, sourceType: StockSourceType, limit?: number): Promise<StockMove[]>;
}
