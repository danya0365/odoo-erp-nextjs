import "server-only";
import { and, eq, desc, count, asc } from "drizzle-orm";

import { db as defaultDb, schema, type Database } from "@/src/infrastructure/db/client";
import type { InstallmentPlan, InstallmentLine, InstallmentPlanWithLines } from "@/src/domain/entities";
import type {
  CreateInstallmentPlanInput,
  IInstallmentPlanRepository,
} from "@/src/application/repositories/IInstallmentPlanRepository";
import type { Page, PageQuery } from "@/src/application/repositories/pagination";
import { toOffsetLimit } from "@/src/application/repositories/pagination";

type Row = typeof schema.installmentPlans.$inferSelect;
type LineRow = typeof schema.installmentLines.$inferSelect;

function toPlan(row: Row): InstallmentPlan {
  return {
    id: row.id,
    shopId: row.shopId,
    invoiceId: row.invoiceId,
    customerId: row.customerId,
    totalAmount: row.totalAmount,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toLine(row: LineRow): InstallmentLine {
  return {
    id: row.id,
    shopId: row.shopId,
    installmentPlanId: row.installmentPlanId,
    seq: row.seq,
    dueDate: row.dueDate,
    amount: row.amount,
    paidAmount: row.paidAmount,
    status: row.status,
  };
}

export class DrizzleInstallmentPlanRepository implements IInstallmentPlanRepository {
  constructor(private readonly db: Database = defaultDb) {}

  async createWithLines(input: CreateInstallmentPlanInput): Promise<InstallmentPlan> {
    return this.db.transaction(async (tx) => {
      const [plan] = await tx
        .insert(schema.installmentPlans)
        .values({
          shopId: input.shopId,
          invoiceId: input.invoiceId,
          customerId: input.customerId,
          totalAmount: input.totalAmount,
        })
        .returning();
      await tx.insert(schema.installmentLines).values(
        input.lines.map((l) => ({
          shopId: input.shopId,
          installmentPlanId: plan.id,
          seq: l.seq,
          dueDate: l.dueDate,
          amount: l.amount,
        })),
      );
      return toPlan(plan);
    });
  }

  async findById(shopId: string, id: string): Promise<InstallmentPlanWithLines | null> {
    const row = await this.db.query.installmentPlans.findFirst({
      where: and(eq(schema.installmentPlans.shopId, shopId), eq(schema.installmentPlans.id, id)),
    });
    if (!row) return null;
    const lines = await this.db
      .select()
      .from(schema.installmentLines)
      .where(
        and(
          eq(schema.installmentLines.shopId, shopId),
          eq(schema.installmentLines.installmentPlanId, id),
        ),
      )
      .orderBy(asc(schema.installmentLines.seq));
    return { ...toPlan(row), lines: lines.map(toLine) };
  }

  async findByInvoice(shopId: string, invoiceId: string): Promise<InstallmentPlan | null> {
    const row = await this.db.query.installmentPlans.findFirst({
      where: and(
        eq(schema.installmentPlans.shopId, shopId),
        eq(schema.installmentPlans.invoiceId, invoiceId),
      ),
    });
    return row ? toPlan(row) : null;
  }

  async list(shopId: string, query: PageQuery): Promise<Page<InstallmentPlan>> {
    const { offset, limit } = toOffsetLimit(query);
    const where = eq(schema.installmentPlans.shopId, shopId);
    const [items, [{ total }]] = await Promise.all([
      this.db
        .select()
        .from(schema.installmentPlans)
        .where(where)
        .orderBy(desc(schema.installmentPlans.createdAt))
        .limit(limit)
        .offset(offset),
      this.db.select({ total: count() }).from(schema.installmentPlans).where(where),
    ]);
    return { items: items.map(toPlan), total, page: query.page, pageSize: limit };
  }

  async payLine(shopId: string, lineId: string, paidAmount: number): Promise<void> {
    await this.db
      .update(schema.installmentLines)
      .set({ paidAmount, status: "paid" })
      .where(and(eq(schema.installmentLines.shopId, shopId), eq(schema.installmentLines.id, lineId)));
  }

  async update(shopId: string, id: string, patch: { status?: InstallmentPlan["status"] }): Promise<InstallmentPlan> {
    const [row] = await this.db
      .update(schema.installmentPlans)
      .set({ ...(patch.status !== undefined && { status: patch.status }) })
      .where(and(eq(schema.installmentPlans.shopId, shopId), eq(schema.installmentPlans.id, id)))
      .returning();
    return toPlan(row);
  }
}
