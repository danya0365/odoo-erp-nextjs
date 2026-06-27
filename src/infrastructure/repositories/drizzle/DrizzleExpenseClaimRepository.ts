import "server-only";
import { and, eq, desc, count } from "drizzle-orm";

import { db as defaultDb, schema, type Database } from "@/src/infrastructure/db/client";
import type { ExpenseClaim } from "@/src/domain/entities";
import type {
  CreateExpenseClaimInput,
  IExpenseClaimRepository,
} from "@/src/application/repositories/IExpenseClaimRepository";
import type { Page, PageQuery } from "@/src/application/repositories/pagination";
import { toOffsetLimit } from "@/src/application/repositories/pagination";

type Row = typeof schema.expenseClaims.$inferSelect;

function toClaim(row: Row): ExpenseClaim {
  return {
    id: row.id,
    shopId: row.shopId,
    docNumber: row.docNumber,
    employeeId: row.employeeId,
    category: row.category,
    description: row.description,
    amount: row.amount,
    status: row.status,
    paidAt: row.paidAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleExpenseClaimRepository implements IExpenseClaimRepository {
  constructor(private readonly db: Database = defaultDb) {}

  async create(input: CreateExpenseClaimInput): Promise<ExpenseClaim> {
    const [row] = await this.db.insert(schema.expenseClaims).values(input).returning();
    return toClaim(row);
  }

  async findById(shopId: string, id: string): Promise<ExpenseClaim | null> {
    const row = await this.db.query.expenseClaims.findFirst({
      where: and(eq(schema.expenseClaims.shopId, shopId), eq(schema.expenseClaims.id, id)),
    });
    return row ? toClaim(row) : null;
  }

  async list(shopId: string, query: PageQuery): Promise<Page<ExpenseClaim>> {
    const { offset, limit } = toOffsetLimit(query);
    const where = eq(schema.expenseClaims.shopId, shopId);
    const [items, [{ total }]] = await Promise.all([
      this.db
        .select()
        .from(schema.expenseClaims)
        .where(where)
        .orderBy(desc(schema.expenseClaims.createdAt))
        .limit(limit)
        .offset(offset),
      this.db.select({ total: count() }).from(schema.expenseClaims).where(where),
    ]);
    return { items: items.map(toClaim), total, page: query.page, pageSize: limit };
  }

  async update(
    shopId: string,
    id: string,
    patch: { status?: ExpenseClaim["status"]; paidAt?: string | null },
  ): Promise<ExpenseClaim> {
    const [row] = await this.db
      .update(schema.expenseClaims)
      .set({
        ...(patch.status !== undefined && { status: patch.status }),
        ...(patch.paidAt !== undefined && { paidAt: patch.paidAt }),
      })
      .where(and(eq(schema.expenseClaims.shopId, shopId), eq(schema.expenseClaims.id, id)))
      .returning();
    return toClaim(row);
  }
}
