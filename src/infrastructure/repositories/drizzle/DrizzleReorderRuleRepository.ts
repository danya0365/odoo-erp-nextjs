import "server-only";
import { and, asc, eq } from "drizzle-orm";

import { db as defaultDb, schema, type Database } from "@/src/infrastructure/db/client";
import type { ReorderRule } from "@/src/domain/entities";
import type { IReorderRuleRepository } from "@/src/application/repositories/IReorderRuleRepository";

type Row = typeof schema.reorderRules.$inferSelect;

function toRule(row: Row): ReorderRule {
  return {
    id: row.id,
    shopId: row.shopId,
    productId: row.productId,
    minQty: row.minQty,
    maxQty: row.maxQty,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleReorderRuleRepository implements IReorderRuleRepository {
  constructor(private readonly db: Database = defaultDb) {}

  async upsert(
    shopId: string,
    productId: string,
    minQty: number,
    maxQty: number,
  ): Promise<ReorderRule> {
    const [row] = await this.db
      .insert(schema.reorderRules)
      .values({ shopId, productId, minQty, maxQty })
      .onConflictDoUpdate({
        target: [schema.reorderRules.shopId, schema.reorderRules.productId],
        set: { minQty, maxQty, updatedAt: new Date().toISOString() },
      })
      .returning();
    return toRule(row);
  }

  async list(shopId: string): Promise<ReorderRule[]> {
    const rows = await this.db
      .select()
      .from(schema.reorderRules)
      .where(eq(schema.reorderRules.shopId, shopId))
      .orderBy(asc(schema.reorderRules.createdAt));
    return rows.map(toRule);
  }

  async findByProduct(shopId: string, productId: string): Promise<ReorderRule | null> {
    const row = await this.db.query.reorderRules.findFirst({
      where: and(
        eq(schema.reorderRules.shopId, shopId),
        eq(schema.reorderRules.productId, productId),
      ),
    });
    return row ? toRule(row) : null;
  }
}
