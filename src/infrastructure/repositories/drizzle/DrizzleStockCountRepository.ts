import "server-only";
import { and, eq, desc, count } from "drizzle-orm";

import { db as defaultDb, schema, type Database } from "@/src/infrastructure/db/client";
import type { StockCount, StockCountLine, StockCountWithLines } from "@/src/domain/entities";
import type {
  CreateStockCountInput,
  IStockCountRepository,
} from "@/src/application/repositories/IStockCountRepository";
import type { Page, PageQuery } from "@/src/application/repositories/pagination";
import { toOffsetLimit } from "@/src/application/repositories/pagination";

type Row = typeof schema.stockCounts.$inferSelect;
type LineRow = typeof schema.stockCountLines.$inferSelect;

function toCount(row: Row): StockCount {
  return {
    id: row.id,
    shopId: row.shopId,
    docNumber: row.docNumber,
    status: row.status,
    note: row.note,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toLine(row: LineRow): StockCountLine {
  return {
    id: row.id,
    shopId: row.shopId,
    stockCountId: row.stockCountId,
    productId: row.productId,
    systemQty: row.systemQty,
    countedQty: row.countedQty,
  };
}

export class DrizzleStockCountRepository implements IStockCountRepository {
  constructor(private readonly db: Database = defaultDb) {}

  async createWithLines(input: CreateStockCountInput): Promise<StockCount> {
    return this.db.transaction(async (tx) => {
      const [row] = await tx
        .insert(schema.stockCounts)
        .values({ shopId: input.shopId, docNumber: input.docNumber, note: input.note })
        .returning();
      if (input.lines.length > 0) {
        await tx.insert(schema.stockCountLines).values(
          input.lines.map((l) => ({
            shopId: input.shopId,
            stockCountId: row.id,
            productId: l.productId,
            systemQty: l.systemQty,
            countedQty: l.countedQty,
          })),
        );
      }
      return toCount(row);
    });
  }

  async findById(shopId: string, id: string): Promise<StockCountWithLines | null> {
    const row = await this.db.query.stockCounts.findFirst({
      where: and(eq(schema.stockCounts.shopId, shopId), eq(schema.stockCounts.id, id)),
    });
    if (!row) return null;
    const lines = await this.db
      .select()
      .from(schema.stockCountLines)
      .where(
        and(
          eq(schema.stockCountLines.shopId, shopId),
          eq(schema.stockCountLines.stockCountId, id),
        ),
      );
    return { ...toCount(row), lines: lines.map(toLine) };
  }

  async list(shopId: string, query: PageQuery): Promise<Page<StockCount>> {
    const { offset, limit } = toOffsetLimit(query);
    const where = eq(schema.stockCounts.shopId, shopId);
    const [items, [{ total }]] = await Promise.all([
      this.db
        .select()
        .from(schema.stockCounts)
        .where(where)
        .orderBy(desc(schema.stockCounts.createdAt))
        .limit(limit)
        .offset(offset),
      this.db.select({ total: count() }).from(schema.stockCounts).where(where),
    ]);
    return { items: items.map(toCount), total, page: query.page, pageSize: limit };
  }

  async updateLineCounts(shopId: string, counts: { id: string; countedQty: number }[]): Promise<void> {
    if (counts.length === 0) return;
    await this.db.transaction(async (tx) => {
      for (const c of counts) {
        await tx
          .update(schema.stockCountLines)
          .set({ countedQty: c.countedQty })
          .where(
            and(
              eq(schema.stockCountLines.shopId, shopId),
              eq(schema.stockCountLines.id, c.id),
            ),
          );
      }
    });
  }

  async update(shopId: string, id: string, patch: { status?: StockCount["status"] }): Promise<StockCount> {
    const [row] = await this.db
      .update(schema.stockCounts)
      .set({ ...(patch.status !== undefined && { status: patch.status }) })
      .where(and(eq(schema.stockCounts.shopId, shopId), eq(schema.stockCounts.id, id)))
      .returning();
    return toCount(row);
  }
}
