import "server-only";
import { and, eq, desc, count, inArray } from "drizzle-orm";

import { db as defaultDb, schema, type Database } from "@/src/infrastructure/db/client";
import type { Invoice, InvoiceLine } from "@/src/domain/entities";
import type {
  CreateInvoiceInput,
  IInvoiceRepository,
} from "@/src/application/repositories/IInvoiceRepository";
import type { Page, PageQuery } from "@/src/application/repositories/pagination";
import { toOffsetLimit } from "@/src/application/repositories/pagination";

type Row = typeof schema.invoices.$inferSelect;

function toInvoice(row: Row): Invoice {
  return {
    id: row.id,
    shopId: row.shopId,
    docNumber: row.docNumber,
    salesOrderId: row.salesOrderId,
    customerId: row.customerId,
    status: row.status,
    currency: row.currency,
    untaxedAmount: row.untaxedAmount,
    taxAmount: row.taxAmount,
    totalAmount: row.totalAmount,
    amountPaid: row.amountPaid,
    dueDate: row.dueDate,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleInvoiceRepository implements IInvoiceRepository {
  constructor(private readonly db: Database = defaultDb) {}

  async createWithLines(input: CreateInvoiceInput): Promise<Invoice> {
    return this.db.transaction(async (tx) => {
      const [inv] = await tx
        .insert(schema.invoices)
        .values({
          shopId: input.shopId,
          docNumber: input.docNumber,
          salesOrderId: input.salesOrderId,
          customerId: input.customerId,
          status: input.status,
          currency: input.currency,
          untaxedAmount: input.untaxedAmount,
          taxAmount: input.taxAmount,
          totalAmount: input.totalAmount,
        })
        .returning();
      if (input.lines.length > 0) {
        await tx.insert(schema.invoiceLines).values(
          input.lines.map((l) => ({
            shopId: input.shopId,
            invoiceId: inv.id,
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
      return toInvoice(inv);
    });
  }

  async findById(shopId: string, id: string): Promise<Invoice | null> {
    const row = await this.db.query.invoices.findFirst({
      where: and(eq(schema.invoices.shopId, shopId), eq(schema.invoices.id, id)),
    });
    return row ? toInvoice(row) : null;
  }

  async listLines(shopId: string, invoiceId: string): Promise<InvoiceLine[]> {
    const rows = await this.db
      .select()
      .from(schema.invoiceLines)
      .where(
        and(
          eq(schema.invoiceLines.shopId, shopId),
          eq(schema.invoiceLines.invoiceId, invoiceId),
        ),
      );
    return rows.map((r) => ({
      id: r.id,
      shopId: r.shopId,
      invoiceId: r.invoiceId,
      productId: r.productId,
      description: r.description,
      qty: r.qty,
      unitPrice: r.unitPrice,
      taxRateBp: r.taxRateBp,
      lineSubtotal: r.lineSubtotal,
      lineTax: r.lineTax,
      lineTotal: r.lineTotal,
    }));
  }

  async listOutstanding(shopId: string): Promise<Invoice[]> {
    const rows = await this.db
      .select()
      .from(schema.invoices)
      .where(and(eq(schema.invoices.shopId, shopId), eq(schema.invoices.status, "posted")))
      .orderBy(desc(schema.invoices.createdAt));
    return rows.map(toInvoice);
  }

  async listByStatuses(shopId: string, statuses: Invoice["status"][]): Promise<Invoice[]> {
    if (statuses.length === 0) return [];
    const rows = await this.db
      .select()
      .from(schema.invoices)
      .where(and(eq(schema.invoices.shopId, shopId), inArray(schema.invoices.status, statuses)))
      .orderBy(desc(schema.invoices.createdAt));
    return rows.map(toInvoice);
  }

  async listBySalesOrder(shopId: string, salesOrderId: string): Promise<Invoice[]> {
    const rows = await this.db
      .select()
      .from(schema.invoices)
      .where(
        and(
          eq(schema.invoices.shopId, shopId),
          eq(schema.invoices.salesOrderId, salesOrderId),
        ),
      )
      .orderBy(desc(schema.invoices.createdAt));
    return rows.map(toInvoice);
  }

  async list(shopId: string, query: PageQuery): Promise<Page<Invoice>> {
    const { offset, limit } = toOffsetLimit(query);
    const where = eq(schema.invoices.shopId, shopId);
    const [items, [{ total }]] = await Promise.all([
      this.db
        .select()
        .from(schema.invoices)
        .where(where)
        .orderBy(desc(schema.invoices.createdAt))
        .limit(limit)
        .offset(offset),
      this.db.select({ total: count() }).from(schema.invoices).where(where),
    ]);
    return { items: items.map(toInvoice), total, page: query.page, pageSize: limit };
  }

  async update(
    shopId: string,
    id: string,
    patch: { status?: Invoice["status"]; amountPaid?: number },
  ): Promise<Invoice> {
    const [row] = await this.db
      .update(schema.invoices)
      .set({
        ...(patch.status !== undefined && { status: patch.status }),
        ...(patch.amountPaid !== undefined && { amountPaid: patch.amountPaid }),
      })
      .where(and(eq(schema.invoices.shopId, shopId), eq(schema.invoices.id, id)))
      .returning();
    return toInvoice(row);
  }
}
