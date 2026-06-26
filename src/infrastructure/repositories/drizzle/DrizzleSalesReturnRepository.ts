import "server-only";
import { and, eq, desc, count } from "drizzle-orm";

import { db as defaultDb, schema, type Database } from "@/src/infrastructure/db/client";
import type { SalesReturn, SalesReturnLine, SalesReturnWithLines } from "@/src/domain/entities";
import type {
  CreateSalesReturnInput,
  ISalesReturnRepository,
} from "@/src/application/repositories/ISalesReturnRepository";
import type { Page, PageQuery } from "@/src/application/repositories/pagination";
import { toOffsetLimit } from "@/src/application/repositories/pagination";

type Row = typeof schema.salesReturns.$inferSelect;
type LineRow = typeof schema.salesReturnLines.$inferSelect;

function toReturn(row: Row): SalesReturn {
  return {
    id: row.id,
    shopId: row.shopId,
    docNumber: row.docNumber,
    invoiceId: row.invoiceId,
    salesOrderId: row.salesOrderId,
    customerId: row.customerId,
    status: row.status,
    currency: row.currency,
    untaxedAmount: row.untaxedAmount,
    taxAmount: row.taxAmount,
    totalAmount: row.totalAmount,
    refundedAmount: row.refundedAmount,
    reason: row.reason,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toLine(row: LineRow): SalesReturnLine {
  return {
    id: row.id,
    shopId: row.shopId,
    salesReturnId: row.salesReturnId,
    productId: row.productId,
    description: row.description,
    qty: row.qty,
    unitPrice: row.unitPrice,
    taxRateBp: row.taxRateBp,
    lineSubtotal: row.lineSubtotal,
    lineTax: row.lineTax,
    lineTotal: row.lineTotal,
  };
}

export class DrizzleSalesReturnRepository implements ISalesReturnRepository {
  constructor(private readonly db: Database = defaultDb) {}

  async createWithLines(input: CreateSalesReturnInput): Promise<SalesReturn> {
    return this.db.transaction(async (tx) => {
      const [ret] = await tx
        .insert(schema.salesReturns)
        .values({
          shopId: input.shopId,
          docNumber: input.docNumber,
          invoiceId: input.invoiceId,
          salesOrderId: input.salesOrderId,
          customerId: input.customerId,
          status: input.status,
          currency: input.currency,
          untaxedAmount: input.untaxedAmount,
          taxAmount: input.taxAmount,
          totalAmount: input.totalAmount,
          reason: input.reason,
        })
        .returning();
      if (input.lines.length > 0) {
        await tx.insert(schema.salesReturnLines).values(
          input.lines.map((l) => ({
            shopId: input.shopId,
            salesReturnId: ret.id,
            productId: l.productId,
            description: l.description,
            qty: l.qty,
            unitPrice: l.unitPrice,
            taxRateBp: l.taxRateBp,
            lineSubtotal: l.lineSubtotal,
            lineTax: l.lineTax,
            lineTotal: l.lineTotal,
          })),
        );
      }
      return toReturn(ret);
    });
  }

  async findById(shopId: string, id: string): Promise<SalesReturnWithLines | null> {
    const row = await this.db.query.salesReturns.findFirst({
      where: and(eq(schema.salesReturns.shopId, shopId), eq(schema.salesReturns.id, id)),
    });
    if (!row) return null;
    const lines = await this.db
      .select()
      .from(schema.salesReturnLines)
      .where(
        and(
          eq(schema.salesReturnLines.shopId, shopId),
          eq(schema.salesReturnLines.salesReturnId, id),
        ),
      );
    return { ...toReturn(row), lines: lines.map(toLine) };
  }

  async list(shopId: string, query: PageQuery): Promise<Page<SalesReturn>> {
    const { offset, limit } = toOffsetLimit(query);
    const where = eq(schema.salesReturns.shopId, shopId);
    const [items, [{ total }]] = await Promise.all([
      this.db
        .select()
        .from(schema.salesReturns)
        .where(where)
        .orderBy(desc(schema.salesReturns.createdAt))
        .limit(limit)
        .offset(offset),
      this.db.select({ total: count() }).from(schema.salesReturns).where(where),
    ]);
    return { items: items.map(toReturn), total, page: query.page, pageSize: limit };
  }

  async listByInvoice(shopId: string, invoiceId: string): Promise<SalesReturn[]> {
    const rows = await this.db
      .select()
      .from(schema.salesReturns)
      .where(
        and(
          eq(schema.salesReturns.shopId, shopId),
          eq(schema.salesReturns.invoiceId, invoiceId),
        ),
      )
      .orderBy(desc(schema.salesReturns.createdAt));
    return rows.map(toReturn);
  }

  async update(
    shopId: string,
    id: string,
    patch: { status?: SalesReturn["status"]; refundedAmount?: number },
  ): Promise<SalesReturn> {
    const [row] = await this.db
      .update(schema.salesReturns)
      .set({
        ...(patch.status !== undefined && { status: patch.status }),
        ...(patch.refundedAmount !== undefined && { refundedAmount: patch.refundedAmount }),
      })
      .where(and(eq(schema.salesReturns.shopId, shopId), eq(schema.salesReturns.id, id)))
      .returning();
    return toReturn(row);
  }
}
