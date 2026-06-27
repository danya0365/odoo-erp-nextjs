import "server-only";
import { and, eq, desc } from "drizzle-orm";

import { db as defaultDb, schema, type Database } from "@/src/infrastructure/db/client";
import type { BankStatementLine, PeriodClose } from "@/src/domain/entities";
import type {
  CreateBankStatementLineInput,
  IBankStatementRepository,
  CreatePeriodCloseInput,
  IPeriodCloseRepository,
} from "@/src/application/repositories/IBankReconciliationRepository";

function toLine(row: typeof schema.bankStatementLines.$inferSelect): BankStatementLine {
  return {
    id: row.id, shopId: row.shopId, statementDate: row.statementDate,
    description: row.description, amount: row.amount, reconciled: row.reconciled, createdAt: row.createdAt,
  };
}

function toClose(row: typeof schema.periodCloses.$inferSelect): PeriodClose {
  return {
    id: row.id, shopId: row.shopId, period: row.period, note: row.note, closedAt: row.closedAt, createdAt: row.createdAt,
  };
}

export class DrizzleBankStatementRepository implements IBankStatementRepository {
  constructor(private readonly db: Database = defaultDb) {}

  async create(input: CreateBankStatementLineInput): Promise<BankStatementLine> {
    const [row] = await this.db.insert(schema.bankStatementLines).values(input).returning();
    return toLine(row);
  }

  async list(shopId: string): Promise<BankStatementLine[]> {
    const rows = await this.db
      .select()
      .from(schema.bankStatementLines)
      .where(eq(schema.bankStatementLines.shopId, shopId))
      .orderBy(desc(schema.bankStatementLines.statementDate));
    return rows.map(toLine);
  }

  async setReconciled(shopId: string, id: string, reconciled: boolean): Promise<void> {
    await this.db
      .update(schema.bankStatementLines)
      .set({ reconciled })
      .where(and(eq(schema.bankStatementLines.shopId, shopId), eq(schema.bankStatementLines.id, id)));
  }
}

export class DrizzlePeriodCloseRepository implements IPeriodCloseRepository {
  constructor(private readonly db: Database = defaultDb) {}

  async create(input: CreatePeriodCloseInput): Promise<PeriodClose> {
    const [row] = await this.db.insert(schema.periodCloses).values(input).returning();
    return toClose(row);
  }

  async list(shopId: string): Promise<PeriodClose[]> {
    const rows = await this.db
      .select()
      .from(schema.periodCloses)
      .where(eq(schema.periodCloses.shopId, shopId))
      .orderBy(desc(schema.periodCloses.period));
    return rows.map(toClose);
  }

  async findByPeriod(shopId: string, period: string): Promise<PeriodClose | null> {
    const row = await this.db.query.periodCloses.findFirst({
      where: and(eq(schema.periodCloses.shopId, shopId), eq(schema.periodCloses.period, period)),
    });
    return row ? toClose(row) : null;
  }
}
