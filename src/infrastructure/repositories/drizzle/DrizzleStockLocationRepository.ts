import "server-only";
import { and, eq } from "drizzle-orm";

import { db as defaultDb, schema, type Database } from "@/src/infrastructure/db/client";
import type { StockLocation } from "@/src/domain/entities";
import type { IStockLocationRepository } from "@/src/application/repositories/IStockLocationRepository";

type Row = typeof schema.stockLocations.$inferSelect;

function toLocation(row: Row): StockLocation {
  return {
    id: row.id,
    shopId: row.shopId,
    name: row.name,
    isDefault: row.isDefault,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleStockLocationRepository implements IStockLocationRepository {
  constructor(private readonly db: Database = defaultDb) {}

  async findDefault(shopId: string): Promise<StockLocation | null> {
    const row = await this.db.query.stockLocations.findFirst({
      where: and(
        eq(schema.stockLocations.shopId, shopId),
        eq(schema.stockLocations.isDefault, true),
      ),
    });
    return row ? toLocation(row) : null;
  }

  async ensureDefault(shopId: string): Promise<StockLocation> {
    const existing = await this.findDefault(shopId);
    if (existing) return existing;
    const [row] = await this.db
      .insert(schema.stockLocations)
      .values({ shopId, name: "คลังหลัก", isDefault: true })
      .returning();
    return toLocation(row);
  }
}
