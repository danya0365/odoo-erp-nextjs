import "server-only";
import { and, eq, ne, asc, desc, sql, count } from "drizzle-orm";

import { db as defaultDb, schema, type Database } from "@/src/infrastructure/db/client";
import type {
  DocSummary,
  IReportingRepository,
  MonthTotalRow,
  TopProductRow,
  ValuationRow,
} from "@/src/application/repositories/IReportingRepository";

export class DrizzleReportingRepository implements IReportingRepository {
  constructor(private readonly db: Database = defaultDb) {}

  async salesSummary(shopId: string): Promise<DocSummary> {
    const [row] = await this.db
      .select({
        count: count(),
        total: sql<number>`coalesce(sum(${schema.invoices.totalAmount}), 0)`,
        paid: sql<number>`coalesce(sum(${schema.invoices.amountPaid}), 0)`,
      })
      .from(schema.invoices)
      .where(and(eq(schema.invoices.shopId, shopId), ne(schema.invoices.status, "cancelled")));
    return { count: Number(row?.count ?? 0), total: Number(row?.total ?? 0), paid: Number(row?.paid ?? 0) };
  }

  async purchaseSummary(shopId: string): Promise<DocSummary> {
    const [row] = await this.db
      .select({
        count: count(),
        total: sql<number>`coalesce(sum(${schema.vendorBills.totalAmount}), 0)`,
        paid: sql<number>`coalesce(sum(${schema.vendorBills.amountPaid}), 0)`,
      })
      .from(schema.vendorBills)
      .where(and(eq(schema.vendorBills.shopId, shopId), ne(schema.vendorBills.status, "cancelled")));
    return { count: Number(row?.count ?? 0), total: Number(row?.total ?? 0), paid: Number(row?.paid ?? 0) };
  }

  async salesByMonth(shopId: string): Promise<MonthTotalRow[]> {
    const month = sql<string>`strftime('%Y-%m', ${schema.invoices.createdAt})`;
    const rows = await this.db
      .select({
        month,
        total: sql<number>`coalesce(sum(${schema.invoices.totalAmount}), 0)`,
      })
      .from(schema.invoices)
      .where(and(eq(schema.invoices.shopId, shopId), ne(schema.invoices.status, "cancelled")))
      .groupBy(month)
      .orderBy(asc(month));
    return rows.map((r) => ({ month: r.month, total: Number(r.total) }));
  }

  async topProducts(shopId: string, limit: number): Promise<TopProductRow[]> {
    const amount = sql<number>`coalesce(sum(${schema.invoiceLines.lineTotal}), 0)`;
    const rows = await this.db
      .select({
        productId: schema.invoiceLines.productId,
        name: schema.products.name,
        qty: sql<number>`coalesce(sum(${schema.invoiceLines.qty}), 0)`,
        amount,
      })
      .from(schema.invoiceLines)
      .innerJoin(schema.products, eq(schema.invoiceLines.productId, schema.products.id))
      .innerJoin(schema.invoices, eq(schema.invoiceLines.invoiceId, schema.invoices.id))
      .where(and(eq(schema.invoiceLines.shopId, shopId), ne(schema.invoices.status, "cancelled")))
      .groupBy(schema.invoiceLines.productId)
      .orderBy(desc(amount))
      .limit(limit);
    return rows.map((r) => ({
      productId: r.productId,
      name: r.name,
      qty: Number(r.qty),
      amount: Number(r.amount),
    }));
  }

  async inventoryValuation(shopId: string): Promise<ValuationRow[]> {
    const rows = await this.db
      .select({
        productId: schema.products.id,
        name: schema.products.name,
        onHand: sql<number>`coalesce(sum(${schema.stockMoves.qtyDelta}), 0)`,
        unitCost: schema.products.costPrice,
      })
      .from(schema.products)
      .leftJoin(schema.stockMoves, eq(schema.stockMoves.productId, schema.products.id))
      .where(and(eq(schema.products.shopId, shopId), eq(schema.products.type, "stockable")))
      .groupBy(schema.products.id)
      .orderBy(asc(schema.products.name));
    return rows.map((r) => ({
      productId: r.productId,
      name: r.name,
      onHand: Number(r.onHand),
      unitCost: r.unitCost,
    }));
  }
}
