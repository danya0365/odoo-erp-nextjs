import type { StoreReview } from "@/src/domain/entities";

export interface CreateReviewInput {
  shopId: string;
  customerName: string;
  rating: number;
  comment?: string | null;
}

export interface IStoreReviewRepository {
  create(input: CreateReviewInput): Promise<StoreReview>;
  listByShop(shopId: string, limit?: number): Promise<StoreReview[]>;
  /** คะแนนทั้งหมด (สำหรับสรุปค่าเฉลี่ย) */
  ratings(shopId: string): Promise<number[]>;
}
