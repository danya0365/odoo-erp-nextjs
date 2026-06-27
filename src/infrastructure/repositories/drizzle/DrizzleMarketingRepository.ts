import "server-only";
import { and, eq, desc, sql } from "drizzle-orm";

import { db as defaultDb, schema, type Database } from "@/src/infrastructure/db/client";
import type { Promotion, LoyaltyAccount } from "@/src/domain/entities";
import type {
  CreatePromotionInput,
  IPromotionRepository,
  ILoyaltyRepository,
} from "@/src/application/repositories/IMarketingRepository";

function toPromo(r: typeof schema.promotions.$inferSelect): Promotion {
  return { id: r.id, shopId: r.shopId, code: r.code, description: r.description, discountType: r.discountType, value: r.value, minSpend: r.minSpend, isActive: r.isActive, createdAt: r.createdAt };
}

function toAccount(r: typeof schema.loyaltyAccounts.$inferSelect): LoyaltyAccount {
  return { id: r.id, shopId: r.shopId, customerId: r.customerId, points: r.points, updatedAt: r.updatedAt };
}

export class DrizzlePromotionRepository implements IPromotionRepository {
  constructor(private readonly db: Database = defaultDb) {}

  async create(input: CreatePromotionInput): Promise<Promotion> {
    const [row] = await this.db.insert(schema.promotions).values(input).returning();
    return toPromo(row);
  }

  async findByCode(shopId: string, code: string): Promise<Promotion | null> {
    const row = await this.db.query.promotions.findFirst({
      where: and(eq(schema.promotions.shopId, shopId), eq(schema.promotions.code, code)),
    });
    return row ? toPromo(row) : null;
  }

  async list(shopId: string): Promise<Promotion[]> {
    const rows = await this.db
      .select()
      .from(schema.promotions)
      .where(eq(schema.promotions.shopId, shopId))
      .orderBy(desc(schema.promotions.createdAt));
    return rows.map(toPromo);
  }

  async setActive(shopId: string, id: string, isActive: boolean): Promise<Promotion> {
    const [row] = await this.db
      .update(schema.promotions)
      .set({ isActive })
      .where(and(eq(schema.promotions.shopId, shopId), eq(schema.promotions.id, id)))
      .returning();
    return toPromo(row);
  }
}

export class DrizzleLoyaltyRepository implements ILoyaltyRepository {
  constructor(private readonly db: Database = defaultDb) {}

  async getOrCreate(shopId: string, customerId: string): Promise<LoyaltyAccount> {
    const existing = await this.db.query.loyaltyAccounts.findFirst({
      where: and(eq(schema.loyaltyAccounts.shopId, shopId), eq(schema.loyaltyAccounts.customerId, customerId)),
    });
    if (existing) return toAccount(existing);
    const [row] = await this.db.insert(schema.loyaltyAccounts).values({ shopId, customerId, points: 0 }).returning();
    return toAccount(row);
  }

  async addPoints(shopId: string, customerId: string, delta: number): Promise<LoyaltyAccount> {
    await this.getOrCreate(shopId, customerId);
    const [row] = await this.db
      .update(schema.loyaltyAccounts)
      .set({ points: sql`${schema.loyaltyAccounts.points} + ${delta}` })
      .where(and(eq(schema.loyaltyAccounts.shopId, shopId), eq(schema.loyaltyAccounts.customerId, customerId)))
      .returning();
    return toAccount(row);
  }

  async list(shopId: string): Promise<LoyaltyAccount[]> {
    const rows = await this.db
      .select()
      .from(schema.loyaltyAccounts)
      .where(eq(schema.loyaltyAccounts.shopId, shopId))
      .orderBy(desc(schema.loyaltyAccounts.points));
    return rows.map(toAccount);
  }
}
