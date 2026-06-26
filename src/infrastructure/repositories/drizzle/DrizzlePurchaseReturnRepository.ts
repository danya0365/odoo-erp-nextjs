import "server-only";
import { and, eq, desc, count } from "drizzle-orm";

import { db as defaultDb, schema, type Database } from "@/src/infrastructure/db/client";
import type { PurchaseReturn, PurchaseReturnLine, PurchaseReturnWithLines } from "@/src/domain/entities";
import type {
  CreatePurchaseReturnInput,
  IPurchaseReturnRepository,
} from "@/src/application/repositories/IPurchaseReturnRepository";
import type { Page, PageQuery } from "@/src/application/repositories/pagination";
import { toOffsetLimit } from "@/src/application/repositories/pagination";

type Row = typeof schema.purchaseReturns.$inferSelect;
type LineRow = typeof schema.purchaseReturnLines.$inferSelect;

function toReturn(row: Row): PurchaseReturn {
  return {
    id: row.id,
    shopId: row.shopId,
    docNumber: row.docNumber,
    vendorBillId: row.vendorBillId,
    purchaseOrderId: row.purchaseOrderId,
    vendorId: row.vendorId,
    status: row.status,
    currency: row.currency,
    untaxedAmount: row.untaxedAmount,
    taxAmount: row.taxAmount,
    totalAmount: row.totalAmount,
    reason: row.reason,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toLine(row: LineRow): PurchaseReturnLine {
  return {
    id: row.id,
    shopId: row.shopId,
    purchaseReturnId: row.purchaseReturnId,
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

export class DrizzlePurchaseReturnRepository implements IPurchaseReturnRepository {
  constructor(private readonly db: Database = defaultDb) {}

  async createWithLines(input: CreatePurchaseReturnInput): Promise<PurchaseReturn> {
    return this.db.transaction(async (tx) => {
      const [ret] = await tx
        .insert(schema.purchaseReturns)
        .values({
          shopId: input.shopId,
          docNumber: input.docNumber,
          vendorBillId: input.vendorBillId,
          purchaseOrderId: input.purchaseOrderId,
          vendorId: input.vendorId,
          status: input.status,
          currency: input.currency,
          untaxedAmount: input.untaxedAmount,
          taxAmount: input.taxAmount,
          totalAmount: input.totalAmount,
          reason: input.reason,
        })
        .returning();
      if (input.lines.length > 0) {
        await tx.insert(schema.purchaseReturnLines).values(
          input.lines.map((l) => ({
            shopId: input.shopId,
            purchaseReturnId: ret.id,
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

  async findById(shopId: string, id: string): Promise<PurchaseReturnWithLines | null> {
    const row = await this.db.query.purchaseReturns.findFirst({
      where: and(eq(schema.purchaseReturns.shopId, shopId), eq(schema.purchaseReturns.id, id)),
    });
    if (!row) return null;
    const lines = await this.db
      .select()
      .from(schema.purchaseReturnLines)
      .where(
        and(
          eq(schema.purchaseReturnLines.shopId, shopId),
          eq(schema.purchaseReturnLines.purchaseReturnId, id),
        ),
      );
    return { ...toReturn(row), lines: lines.map(toLine) };
  }

  async list(shopId: string, query: PageQuery): Promise<Page<PurchaseReturn>> {
    const { offset, limit } = toOffsetLimit(query);
    const where = eq(schema.purchaseReturns.shopId, shopId);
    const [items, [{ total }]] = await Promise.all([
      this.db
        .select()
        .from(schema.purchaseReturns)
        .where(where)
        .orderBy(desc(schema.purchaseReturns.createdAt))
        .limit(limit)
        .offset(offset),
      this.db.select({ total: count() }).from(schema.purchaseReturns).where(where),
    ]);
    return { items: items.map(toReturn), total, page: query.page, pageSize: limit };
  }

  async update(shopId: string, id: string, patch: { status?: PurchaseReturn["status"] }): Promise<PurchaseReturn> {
    const [row] = await this.db
      .update(schema.purchaseReturns)
      .set({ ...(patch.status !== undefined && { status: patch.status }) })
      .where(and(eq(schema.purchaseReturns.shopId, shopId), eq(schema.purchaseReturns.id, id)))
      .returning();
    return toReturn(row);
  }
}
