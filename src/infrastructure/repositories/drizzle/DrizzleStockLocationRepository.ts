import "server-only";
import { and, asc, eq } from "drizzle-orm";

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

  async list(shopId: string): Promise<StockLocation[]> {
    const rows = await this.db
      .select()
      .from(schema.stockLocations)
      .where(eq(schema.stockLocations.shopId, shopId))
      .orderBy(asc(schema.stockLocations.createdAt));
    return rows.map(toLocation);
  }

  async findById(shopId: string, id: string): Promise<StockLocation | null> {
    const row = await this.db.query.stockLocations.findFirst({
      where: and(eq(schema.stockLocations.shopId, shopId), eq(schema.stockLocations.id, id)),
    });
    return row ? toLocation(row) : null;
  }

  async create(shopId: string, name: string): Promise<StockLocation> {
    const [row] = await this.db
      .insert(schema.stockLocations)
      .values({ shopId, name, isDefault: false })
      .returning();
    return toLocation(row);
  }
}
