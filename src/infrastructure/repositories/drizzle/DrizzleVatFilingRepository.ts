import "server-only";
import { and, eq, desc } from "drizzle-orm";

import { db as defaultDb, schema, type Database } from "@/src/infrastructure/db/client";
import type { VatFiling } from "@/src/domain/entities";
import type {
  CreateVatFilingInput,
  IVatFilingRepository,
} from "@/src/application/repositories/IVatFilingRepository";

type Row = typeof schema.vatFilings.$inferSelect;

function toFiling(row: Row): VatFiling {
  return {
    id: row.id,
    shopId: row.shopId,
    periodStart: row.periodStart,
    periodEnd: row.periodEnd,
    outputVat: row.outputVat,
    inputVat: row.inputVat,
    netPayable: row.netPayable,
    filedAt: row.filedAt,
    createdAt: row.createdAt,
  };
}

export class DrizzleVatFilingRepository implements IVatFilingRepository {
  constructor(private readonly db: Database = defaultDb) {}

  async create(input: CreateVatFilingInput): Promise<VatFiling> {
    const [row] = await this.db.insert(schema.vatFilings).values(input).returning();
    return toFiling(row);
  }

  async list(shopId: string): Promise<VatFiling[]> {
    const rows = await this.db
      .select()
      .from(schema.vatFilings)
      .where(eq(schema.vatFilings.shopId, shopId))
      .orderBy(desc(schema.vatFilings.periodStart));
    return rows.map(toFiling);
  }

  async findByPeriod(shopId: string, periodStart: string): Promise<VatFiling | null> {
    const row = await this.db.query.vatFilings.findFirst({
      where: and(
        eq(schema.vatFilings.shopId, shopId),
        eq(schema.vatFilings.periodStart, periodStart),
      ),
    });
    return row ? toFiling(row) : null;
  }
}
