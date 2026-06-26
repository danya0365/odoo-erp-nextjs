import "server-only";
import { desc, eq } from "drizzle-orm";

import { db as defaultDb, schema, type Database } from "@/src/infrastructure/db/client";
import type { StoreReview } from "@/src/domain/entities";
import type {
  CreateReviewInput,
  IStoreReviewRepository,
} from "@/src/application/repositories/IStoreReviewRepository";

type Row = typeof schema.storeReviews.$inferSelect;

function toReview(row: Row): StoreReview {
  return {
    id: row.id,
    shopId: row.shopId,
    customerName: row.customerName,
    rating: row.rating,
    comment: row.comment,
    createdAt: row.createdAt,
  };
}

export class DrizzleStoreReviewRepository implements IStoreReviewRepository {
  constructor(private readonly db: Database = defaultDb) {}

  async create(input: CreateReviewInput): Promise<StoreReview> {
    const [row] = await this.db
      .insert(schema.storeReviews)
      .values({
        shopId: input.shopId,
        customerName: input.customerName,
        rating: input.rating,
        comment: input.comment ?? null,
      })
      .returning();
    return toReview(row);
  }

  async listByShop(shopId: string, limit = 50): Promise<StoreReview[]> {
    const rows = await this.db
      .select()
      .from(schema.storeReviews)
      .where(eq(schema.storeReviews.shopId, shopId))
      .orderBy(desc(schema.storeReviews.createdAt))
      .limit(limit);
    return rows.map(toReview);
  }

  async ratings(shopId: string): Promise<number[]> {
    const rows = await this.db
      .select({ rating: schema.storeReviews.rating })
      .from(schema.storeReviews)
      .where(eq(schema.storeReviews.shopId, shopId));
    return rows.map((r) => r.rating);
  }
}
