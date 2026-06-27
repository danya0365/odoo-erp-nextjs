import type { Promotion, LoyaltyAccount, DiscountType } from "@/src/domain/entities";

export interface CreatePromotionInput {
  shopId: string;
  code: string;
  description: string;
  discountType: DiscountType;
  value: number;
  minSpend: number;
}

export interface IPromotionRepository {
  create(input: CreatePromotionInput): Promise<Promotion>;
  findByCode(shopId: string, code: string): Promise<Promotion | null>;
  list(shopId: string): Promise<Promotion[]>;
  setActive(shopId: string, id: string, isActive: boolean): Promise<Promotion>;
}

export interface ILoyaltyRepository {
  /** อ่านบัญชีแต้ม (สร้างถ้ายังไม่มี) */
  getOrCreate(shopId: string, customerId: string): Promise<LoyaltyAccount>;
  /** บวก/ลบแต้ม (delta) คืนยอดใหม่ */
  addPoints(shopId: string, customerId: string, delta: number): Promise<LoyaltyAccount>;
  list(shopId: string): Promise<LoyaltyAccount[]>;
}
