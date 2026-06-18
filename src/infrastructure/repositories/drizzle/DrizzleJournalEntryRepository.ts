import "server-only";
import { and, asc, desc, eq, gte, lte, count, sql, type SQL } from "drizzle-orm";

import { db as defaultDb, schema, type Database } from "@/src/infrastructure/db/client";
import type {
  JournalEntry,
  JournalEntryLine,
  JournalEntryWithLines,
  JournalEntrySourceType,
} from "@/src/domain/entities";
import type {
  CreateJournalEntryInput,
  DateRange,
  IJournalEntryRepository,
  LedgerLine,
  TrialBalanceRow,
} from "@/src/application/repositories/IJournalEntryRepository";
import type { Page, PageQuery } from "@/src/application/repositories/pagination";
import { toOffsetLimit } from "@/src/application/repositories/pagination";

type Row = typeof schema.journalEntries.$inferSelect;
type LineRow = typeof schema.journalEntryLines.$inferSelect;

function toEntry(row: Row): JournalEntry {
  return {
    id: row.id,
    shopId: row.shopId,
    docNumber: row.docNumber,
    journalId: row.journalId,
    date: row.date,
    ref: row.ref,
    sourceType: row.sourceType,
    sourceId: row.sourceId,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toLine(row: LineRow): JournalEntryLine {
  return {
    id: row.id,
    shopId: row.shopId,
    entryId: row.entryId,
    accountId: row.accountId,
    partnerId: row.partnerId,
    label: row.label,
    debit: row.debit,
    credit: row.credit,
  };
}

function dateBounds(range: DateRange | undefined): SQL[] {
  const conds: SQL[] = [];
  if (range?.from) conds.push(gte(schema.journalEntries.date, range.from));
  if (range?.to) conds.push(lte(schema.journalEntries.date, range.to));
  return conds;
}

export class DrizzleJournalEntryRepository implements IJournalEntryRepository {
  constructor(private readonly db: Database = defaultDb) {}

  async createWithLines(input: CreateJournalEntryInput): Promise<JournalEntry> {
    return this.db.transaction(async (tx) => {
      const [entry] = await tx
        .insert(schema.journalEntries)
        .values({
          shopId: input.shopId,
          docNumber: input.docNumber,
          journalId: input.journalId,
          date: input.date,
          ref: input.ref ?? null,
          sourceType: input.sourceType,
          sourceId: input.sourceId ?? null,
          status: input.status,
        })
        .returning();
      if (input.lines.length > 0) {
        await tx.insert(schema.journalEntryLines).values(
          input.lines.map((l) => ({
            shopId: input.shopId,
            entryId: entry.id,
            accountId: l.accountId,
            partnerId: l.partnerId ?? null,
            label: l.label,
            debit: l.debit,
            credit: l.credit,
          })),
        );
      }
      return toEntry(entry);
    });
  }

  async findById(shopId: string, id: string): Promise<JournalEntryWithLines | null> {
    const entry = await this.db.query.journalEntries.findFirst({
      where: and(eq(schema.journalEntries.shopId, shopId), eq(schema.journalEntries.id, id)),
    });
    if (!entry) return null;
    const lines = await this.db
      .select()
      .from(schema.journalEntryLines)
      .where(
        and(
          eq(schema.journalEntryLines.shopId, shopId),
          eq(schema.journalEntryLines.entryId, id),
        ),
      );
    return { ...toEntry(entry), lines: lines.map(toLine) };
  }

  async findBySource(
    shopId: string,
    sourceType: JournalEntrySourceType,
    sourceId: string,
  ): Promise<JournalEntry | null> {
    const row = await this.db.query.journalEntries.findFirst({
      where: and(
        eq(schema.journalEntries.shopId, shopId),
        eq(schema.journalEntries.sourceType, sourceType),
        eq(schema.journalEntries.sourceId, sourceId),
      ),
    });
    return row ? toEntry(row) : null;
  }

  async list(shopId: string, query: PageQuery): Promise<Page<JournalEntry>> {
    const { offset, limit } = toOffsetLimit(query);
    const where = eq(schema.journalEntries.shopId, shopId);
    const [items, [{ total }]] = await Promise.all([
      this.db
        .select()
        .from(schema.journalEntries)
        .where(where)
        .orderBy(desc(schema.journalEntries.date), desc(schema.journalEntries.createdAt))
        .limit(limit)
        .offset(offset),
      this.db.select({ total: count() }).from(schema.journalEntries).where(where),
    ]);
    return { items: items.map(toEntry), total, page: query.page, pageSize: limit };
  }

  async trialBalance(shopId: string, range?: DateRange): Promise<TrialBalanceRow[]> {
    const rows = await this.db
      .select({
        accountId: schema.accounts.id,
        code: schema.accounts.code,
        name: schema.accounts.name,
        type: schema.accounts.type,
        debit: sql<number>`coalesce(sum(${schema.journalEntryLines.debit}), 0)`,
        credit: sql<number>`coalesce(sum(${schema.journalEntryLines.credit}), 0)`,
      })
      .from(schema.journalEntryLines)
      .innerJoin(
        schema.accounts,
        eq(schema.journalEntryLines.accountId, schema.accounts.id),
      )
      .innerJoin(
        schema.journalEntries,
        eq(schema.journalEntryLines.entryId, schema.journalEntries.id),
      )
      .where(
        and(
          eq(schema.journalEntryLines.shopId, shopId),
          eq(schema.journalEntries.status, "posted"),
          ...dateBounds(range),
        ),
      )
      .groupBy(schema.accounts.id)
      .orderBy(asc(schema.accounts.code));
    return rows.map((r) => ({
      accountId: r.accountId,
      code: r.code,
      name: r.name,
      type: r.type,
      debit: Number(r.debit),
      credit: Number(r.credit),
    }));
  }

  async ledger(shopId: string, accountId: string, range?: DateRange): Promise<LedgerLine[]> {
    const rows = await this.db
      .select({
        entryId: schema.journalEntries.id,
        docNumber: schema.journalEntries.docNumber,
        date: schema.journalEntries.date,
        ref: schema.journalEntries.ref,
        label: schema.journalEntryLines.label,
        debit: schema.journalEntryLines.debit,
        credit: schema.journalEntryLines.credit,
      })
      .from(schema.journalEntryLines)
      .innerJoin(
        schema.journalEntries,
        eq(schema.journalEntryLines.entryId, schema.journalEntries.id),
      )
      .where(
        and(
          eq(schema.journalEntryLines.shopId, shopId),
          eq(schema.journalEntryLines.accountId, accountId),
          eq(schema.journalEntries.status, "posted"),
          ...dateBounds(range),
        ),
      )
      .orderBy(asc(schema.journalEntries.date), asc(schema.journalEntries.createdAt));
    return rows.map((r) => ({
      entryId: r.entryId,
      docNumber: r.docNumber,
      date: r.date,
      ref: r.ref,
      label: r.label,
      debit: r.debit,
      credit: r.credit,
    }));
  }
}
