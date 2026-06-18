import "server-only";
import { and, eq, desc, sql } from "drizzle-orm";

import { db as defaultDb, schema, type Database } from "@/src/infrastructure/db/client";
import type { StockMove } from "@/src/domain/entities";
import type { StockSourceType } from "@/src/domain/entities";
import type {
  StockMoveInput,
  OnHandRow,
  OnHandLocationRow,
  IStockMoveRepository,
} from "@/src/application/repositories/IStockMoveRepository";

type Row = typeof schema.stockMoves.$inferSelect;

function toMove(row: Row): StockMove {
  return {
    id: row.id,
    shopId: row.shopId,
    productId: row.productId,
    locationId: row.locationId,
    qtyDelta: row.qtyDelta,
    type: row.type,
    sourceType: row.sourceType,
    sourceId: row.sourceId,
    note: row.note,
    createdAt: row.createdAt,
  };
}

export class DrizzleStockMoveRepository implements IStockMoveRepository {
  constructor(private readonly db: Database = defaultDb) {}

  async appendMany(moves: StockMoveInput[]): Promise<StockMove[]> {
    if (moves.length === 0) return [];
    const rows = await this.db
      .insert(schema.stockMoves)
      .values(
        moves.map((m) => ({
          shopId: m.shopId,
          productId: m.productId,
          locationId: m.locationId,
          qtyDelta: m.qtyDelta,
          type: m.type,
          sourceType: m.sourceType,
          sourceId: m.sourceId ?? null,
          note: m.note ?? null,
        })),
      )
      .returning();
    return rows.map(toMove);
  }

  async onHandByProduct(shopId: string, productId: string): Promise<number> {
    const [row] = await this.db
      .select({ onHand: sql<number>`coalesce(sum(${schema.stockMoves.qtyDelta}), 0)` })
      .from(schema.stockMoves)
      .where(
        and(
          eq(schema.stockMoves.shopId, shopId),
          eq(schema.stockMoves.productId, productId),
        ),
      );
    return row?.onHand ?? 0;
  }

  async onHandByProductAndLocation(
    shopId: string,
    productId: string,
    locationId: string,
  ): Promise<number> {
    const [row] = await this.db
      .select({ onHand: sql<number>`coalesce(sum(${schema.stockMoves.qtyDelta}), 0)` })
      .from(schema.stockMoves)
      .where(
        and(
          eq(schema.stockMoves.shopId, shopId),
          eq(schema.stockMoves.productId, productId),
          eq(schema.stockMoves.locationId, locationId),
        ),
      );
    return Number(row?.onHand ?? 0);
  }

  async onHandList(shopId: string): Promise<OnHandRow[]> {
    return this.db
      .select({
        productId: schema.stockMoves.productId,
        onHand: sql<number>`coalesce(sum(${schema.stockMoves.qtyDelta}), 0)`,
      })
      .from(schema.stockMoves)
      .where(eq(schema.stockMoves.shopId, shopId))
      .groupBy(schema.stockMoves.productId);
  }

  async onHandByLocationList(shopId: string): Promise<OnHandLocationRow[]> {
    const rows = await this.db
      .select({
        productId: schema.stockMoves.productId,
        locationId: schema.stockMoves.locationId,
        onHand: sql<number>`coalesce(sum(${schema.stockMoves.qtyDelta}), 0)`,
      })
      .from(schema.stockMoves)
      .where(eq(schema.stockMoves.shopId, shopId))
      .groupBy(schema.stockMoves.productId, schema.stockMoves.locationId);
    return rows.map((r) => ({ ...r, onHand: Number(r.onHand) }));
  }

  async listByProduct(
    shopId: string,
    productId: string,
    limit = 50,
  ): Promise<StockMove[]> {
    const rows = await this.db
      .select()
      .from(schema.stockMoves)
      .where(
        and(
          eq(schema.stockMoves.shopId, shopId),
          eq(schema.stockMoves.productId, productId),
        ),
      )
      .orderBy(desc(schema.stockMoves.createdAt))
      .limit(limit);
    return rows.map(toMove);
  }

  async listBySourceType(
    shopId: string,
    sourceType: StockSourceType,
    limit = 50,
  ): Promise<StockMove[]> {
    const rows = await this.db
      .select()
      .from(schema.stockMoves)
      .where(
        and(
          eq(schema.stockMoves.shopId, shopId),
          eq(schema.stockMoves.sourceType, sourceType),
        ),
      )
      .orderBy(desc(schema.stockMoves.createdAt))
      .limit(limit);
    return rows.map(toMove);
  }
}
