import "server-only";
import { and, desc, eq, count } from "drizzle-orm";

import { db as defaultDb, schema, type Database } from "@/src/infrastructure/db/client";
import type { PayrollRun, Payslip, PayrollRunWithSlips } from "@/src/domain/entities";
import type {
  CreatePayrollRunInput,
  IPayrollRunRepository,
  PayrollRunPatch,
} from "@/src/application/repositories/IPayrollRunRepository";
import type { Page, PageQuery } from "@/src/application/repositories/pagination";
import { toOffsetLimit } from "@/src/application/repositories/pagination";

type Row = typeof schema.payrollRuns.$inferSelect;
type SlipRow = typeof schema.payslips.$inferSelect;

function toRun(row: Row): PayrollRun {
  return {
    id: row.id,
    shopId: row.shopId,
    docNumber: row.docNumber,
    period: row.period,
    whtRateBp: row.whtRateBp,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toSlip(row: SlipRow): Payslip {
  return {
    id: row.id,
    shopId: row.shopId,
    runId: row.runId,
    employeeId: row.employeeId,
    gross: row.gross,
    tax: row.tax,
    net: row.net,
  };
}

export class DrizzlePayrollRunRepository implements IPayrollRunRepository {
  constructor(private readonly db: Database = defaultDb) {}

  async createWithSlips(input: CreatePayrollRunInput): Promise<PayrollRun> {
    return this.db.transaction(async (tx) => {
      const [run] = await tx
        .insert(schema.payrollRuns)
        .values({ shopId: input.shopId, period: input.period, whtRateBp: input.whtRateBp })
        .returning();
      if (input.slips.length > 0) {
        await tx.insert(schema.payslips).values(
          input.slips.map((s) => ({
            shopId: input.shopId,
            runId: run.id,
            employeeId: s.employeeId,
            gross: s.gross,
            tax: s.tax,
            net: s.net,
          })),
        );
      }
      return toRun(run);
    });
  }

  async findById(shopId: string, id: string): Promise<PayrollRunWithSlips | null> {
    const run = await this.db.query.payrollRuns.findFirst({
      where: and(eq(schema.payrollRuns.shopId, shopId), eq(schema.payrollRuns.id, id)),
    });
    if (!run) return null;
    const slips = await this.db
      .select()
      .from(schema.payslips)
      .where(and(eq(schema.payslips.shopId, shopId), eq(schema.payslips.runId, id)));
    return { ...toRun(run), slips: slips.map(toSlip) };
  }

  async list(shopId: string, query: PageQuery): Promise<Page<PayrollRun>> {
    const { offset, limit } = toOffsetLimit(query);
    const where = eq(schema.payrollRuns.shopId, shopId);
    const [items, [{ total }]] = await Promise.all([
      this.db.select().from(schema.payrollRuns).where(where).orderBy(desc(schema.payrollRuns.createdAt)).limit(limit).offset(offset),
      this.db.select({ total: count() }).from(schema.payrollRuns).where(where),
    ]);
    return { items: items.map(toRun), total, page: query.page, pageSize: limit };
  }

  async update(shopId: string, id: string, patch: PayrollRunPatch): Promise<PayrollRun> {
    const [row] = await this.db
      .update(schema.payrollRuns)
      .set({
        ...(patch.docNumber !== undefined && { docNumber: patch.docNumber }),
        ...(patch.status !== undefined && { status: patch.status }),
      })
      .where(and(eq(schema.payrollRuns.shopId, shopId), eq(schema.payrollRuns.id, id)))
      .returning();
    return toRun(row);
  }
}
