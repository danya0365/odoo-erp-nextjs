import type { Promotion, LoyaltyAccount, DiscountType } from "@/src/domain/entities";
import { discountAmount, pointsFromSpend } from "@/src/domain/services/promotion";
import type { IPromotionRepository, ILoyaltyRepository } from "@/src/application/repositories/IMarketingRepository";
import type { IPartnerRepository } from "@/src/application/repositories/IPartnerRepository";

/** ตั้งโปรโมชั่น/คูปอง (code ไม่ซ้ำ) */
export class CreatePromotionUseCase {
  constructor(private readonly promos: IPromotionRepository) {}
  async execute(shopId: string, code: string, description: string, discountType: DiscountType, value: number, minSpend: number): Promise<Promotion> {
    const c = code.trim().toUpperCase();
    if (!c) throw new Error("กรุณาระบุโค้ด");
    if (value <= 0) throw new Error("ส่วนลดต้องมากกว่า 0");
    if (discountType === "percent" && value > 100) throw new Error("เปอร์เซ็นต์ต้องไม่เกิน 100");
    const existing = await this.promos.findByCode(shopId, c);
    if (existing) throw new Error("มีโค้ดนี้แล้ว");
    return this.promos.create({ shopId, code: c, description, discountType, value, minSpend });
  }
}

export interface ApplyPromotionResult {
  discount: number;
  total: number;
  eligible: boolean;
}

/** ใช้โค้ดส่วนลดกับยอดซื้อ — คำนวณส่วนลดอัตโนมัติ (เช็คเงื่อนไขขั้นต่ำ) */
export class ApplyPromotionUseCase {
  constructor(private readonly promos: IPromotionRepository) {}
  async execute(shopId: string, code: string, subtotal: number): Promise<ApplyPromotionResult> {
    const promo = await this.promos.findByCode(shopId, code.trim().toUpperCase());
    if (!promo) throw new Error("ไม่พบโค้ดส่วนลด");
    if (!promo.isActive) throw new Error("โค้ดนี้ปิดใช้งานแล้ว");
    const eligible = subtotal >= promo.minSpend;
    const discount = discountAmount(subtotal, promo.discountType, promo.value, promo.minSpend);
    return { discount, total: subtotal - discount, eligible };
  }
}

/** สะสมแต้มจากยอดซื้อ */
export class EarnPointsUseCase {
  constructor(
    private readonly loyalty: ILoyaltyRepository,
    private readonly partners: IPartnerRepository,
  ) {}
  async execute(shopId: string, customerId: string, spendAmount: number, ratePerPoint: number): Promise<LoyaltyAccount> {
    const cust = await this.partners.findById(shopId, customerId);
    if (!cust) throw new Error("ไม่พบลูกค้า");
    const earned = pointsFromSpend(spendAmount, ratePerPoint);
    if (earned <= 0) throw new Error("ยอดซื้อยังไม่ถึงเกณฑ์รับแต้ม");
    return this.loyalty.addPoints(shopId, customerId, earned);
  }
}

/** แลกแต้ม (กันแต้มติดลบ) */
export class RedeemPointsUseCase {
  constructor(private readonly loyalty: ILoyaltyRepository) {}
  async execute(shopId: string, customerId: string, points: number): Promise<LoyaltyAccount> {
    if (points <= 0) throw new Error("จำนวนแต้มต้องมากกว่า 0");
    const acc = await this.loyalty.getOrCreate(shopId, customerId);
    if (acc.points < points) throw new Error("แต้มไม่พอ");
    return this.loyalty.addPoints(shopId, customerId, -points);
  }
}
