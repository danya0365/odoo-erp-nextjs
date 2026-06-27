import type { ProductLot } from "@/src/domain/entities";

export interface CreateProductLotInput {
  shopId: string;
  productId: string;
  lotNumber: string;
  expiryDate: string;
  qty: number;
}

export interface IProductLotRepository {
  create(input: CreateProductLotInput): Promise<ProductLot>;
  findById(shopId: string, id: string): Promise<ProductLot | null>;
  /** ล็อตของสินค้าที่ยังมีของเหลือ (qty > 0) */
  listByProduct(shopId: string, productId: string): Promise<ProductLot[]>;
  /** ทุกล็อต (สำหรับหน้ารายการ/แจ้งเตือน) */
  listAll(shopId: string): Promise<ProductLot[]>;
  setQty(shopId: string, id: string, qty: number): Promise<void>;
}
