import type { StoreReview } from "@/src/domain/entities";
import { isValidRating } from "@/src/domain/services/review";
import type { IShopRepository } from "@/src/application/repositories/IShopRepository";
import type { IStoreReviewRepository } from "@/src/application/repositories/IStoreReviewRepository";

export interface SubmitReviewInput {
  slug: string;
  customerName: string;
  rating: number;
  comment?: string | null;
}

/** ส่งรีวิวร้าน (public) — ตรวจร้านเปิด + ชื่อ + คะแนน 1–5 */
export class SubmitReviewUseCase {
  constructor(
    private readonly shops: IShopRepository,
    private readonly reviews: IStoreReviewRepository,
  ) {}

  async execute(input: SubmitReviewInput): Promise<StoreReview> {
    const name = input.customerName?.trim();
    if (!name) throw new Error("กรุณาระบุชื่อ");
    if (!isValidRating(input.rating)) throw new Error("กรุณาให้คะแนน 1–5 ดาว");

    const shop = await this.shops.findBySlug(input.slug);
    if (!shop || !shop.isActive) throw new Error("ไม่พบร้านค้า");

    return this.reviews.create({
      shopId: shop.id,
      customerName: name,
      rating: input.rating,
      comment: input.comment?.trim() || null,
    });
  }
}
