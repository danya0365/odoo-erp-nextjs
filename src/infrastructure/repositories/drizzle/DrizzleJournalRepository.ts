import "server-only";
import { and, asc, eq } from "drizzle-orm";

import { db as defaultDb, schema, type Database } from "@/src/infrastructure/db/client";
import type { Journal, JournalType } from "@/src/domain/entities";
import { DEFAULT_JOURNALS } from "@/src/domain/services/accounting";
import type { IJournalRepository } from "@/src/application/repositories/IJournalRepository";

type Row = typeof schema.journals.$inferSelect;

function toJournal(row: Row): Journal {
  return {
    id: row.id,
    shopId: row.shopId,
    code: row.code,
    name: row.name,
    type: row.type,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleJournalRepository implements IJournalRepository {
  constructor(private readonly db: Database = defaultDb) {}

  async ensureDefaults(shopId: string): Promise<Journal[]> {
    const existing = await this.list(shopId);
    if (existing.length > 0) return existing;
    await this.db
      .insert(schema.journals)
      .values(DEFAULT_JOURNALS.map((j) => ({ shopId, code: j.code, name: j.name, type: j.type })))
      .onConflictDoNothing();
    return this.list(shopId);
  }

  async list(shopId: string): Promise<Journal[]> {
    const rows = await this.db
      .select()
      .from(schema.journals)
      .where(eq(schema.journals.shopId, shopId))
      .orderBy(asc(schema.journals.code));
    return rows.map(toJournal);
  }

  async findByType(shopId: string, type: JournalType): Promise<Journal | null> {
    const row = await this.db.query.journals.findFirst({
      where: and(eq(schema.journals.shopId, shopId), eq(schema.journals.type, type)),
    });
    return row ? toJournal(row) : null;
  }
}
