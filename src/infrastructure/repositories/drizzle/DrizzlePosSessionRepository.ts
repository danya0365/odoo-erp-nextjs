import "server-only";
import { and, desc, eq, count } from "drizzle-orm";

import { db as defaultDb, schema, type Database } from "@/src/infrastructure/db/client";
import type { PosSession } from "@/src/domain/entities";
import type {
  CloseSessionPatch,
  IPosSessionRepository,
  OpenSessionInput,
} from "@/src/application/repositories/IPosSessionRepository";
import type { Page, PageQuery } from "@/src/application/repositories/pagination";
import { toOffsetLimit } from "@/src/application/repositories/pagination";

type Row = typeof schema.posSessions.$inferSelect;

function toSession(row: Row): PosSession {
  return {
    id: row.id,
    shopId: row.shopId,
    userId: row.userId,
    status: row.status,
    openingCash: row.openingCash,
    closingCash: row.closingCash,
    expectedCash: row.expectedCash,
    difference: row.difference,
    openedAt: row.openedAt,
    closedAt: row.closedAt,
  };
}

export class DrizzlePosSessionRepository implements IPosSessionRepository {
  constructor(private readonly db: Database = defaultDb) {}

  async open(input: OpenSessionInput): Promise<PosSession> {
    const [row] = await this.db
      .insert(schema.posSessions)
      .values({
        shopId: input.shopId,
        userId: input.userId,
        status: "open",
        openingCash: input.openingCash,
        openedAt: input.openedAt,
      })
      .returning();
    return toSession(row);
  }

  async findById(shopId: string, id: string): Promise<PosSession | null> {
    const row = await this.db.query.posSessions.findFirst({
      where: and(eq(schema.posSessions.shopId, shopId), eq(schema.posSessions.id, id)),
    });
    return row ? toSession(row) : null;
  }

  async findOpen(shopId: string): Promise<PosSession | null> {
    const row = await this.db.query.posSessions.findFirst({
      where: and(eq(schema.posSessions.shopId, shopId), eq(schema.posSessions.status, "open")),
    });
    return row ? toSession(row) : null;
  }

  async list(shopId: string, query: PageQuery): Promise<Page<PosSession>> {
    const { offset, limit } = toOffsetLimit(query);
    const where = eq(schema.posSessions.shopId, shopId);
    const [items, [{ total }]] = await Promise.all([
      this.db.select().from(schema.posSessions).where(where).orderBy(desc(schema.posSessions.openedAt)).limit(limit).offset(offset),
      this.db.select({ total: count() }).from(schema.posSessions).where(where),
    ]);
    return { items: items.map(toSession), total, page: query.page, pageSize: limit };
  }

  async close(shopId: string, id: string, patch: CloseSessionPatch): Promise<PosSession> {
    const [row] = await this.db
      .update(schema.posSessions)
      .set({
        status: "closed",
        closingCash: patch.closingCash,
        expectedCash: patch.expectedCash,
        difference: patch.difference,
        closedAt: patch.closedAt,
      })
      .where(and(eq(schema.posSessions.shopId, shopId), eq(schema.posSessions.id, id)))
      .returning();
    return toSession(row);
  }
}
