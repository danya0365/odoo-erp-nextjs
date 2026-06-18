import "server-only";
import { and, eq, desc, count } from "drizzle-orm";

import { db as defaultDb, schema, type Database } from "@/src/infrastructure/db/client";
import type {
  SalesOrder,
  SalesOrderLine,
  SalesOrderWithLines,
} from "@/src/domain/entities";
import type {
  CreateSalesOrderInput,
  SalesOrderHeaderPatch,
  SalesLineProgressPatch,
  ISalesOrderRepository,
} from "@/src/application/repositories/ISalesOrderRepository";
import type { Page, PageQuery } from "@/src/application/repositories/pagination";
import { toOffsetLimit } from "@/src/application/repositories/pagination";

type OrderRow = typeof schema.salesOrders.$inferSelect;
type LineRow = typeof schema.salesOrderLines.$inferSelect;

function toOrder(row: OrderRow): SalesOrder {
  return {
    id: row.id,
    shopId: row.shopId,
    docNumber: row.docNumber,
    customerId: row.customerId,
    status: row.status,
    currency: row.currency,
    untaxedAmount: row.untaxedAmount,
    taxAmount: row.taxAmount,
    totalAmount: row.totalAmount,
    orderDate: row.orderDate,
    confirmedAt: row.confirmedAt,
    note: row.note,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toLine(row: LineRow): SalesOrderLine {
  return {
    id: row.id,
    shopId: row.shopId,
    salesOrderId: row.salesOrderId,
    productId: row.productId,
    description: row.description,
    qtyOrdered: row.qtyOrdered,
    qtyDelivered: row.qtyDelivered,
    qtyInvoiced: row.qtyInvoiced,
    unitPrice: row.unitPrice,
    taxRateBp: row.taxRateBp,
    lineSubtotal: row.lineSubtotal,
    lineTax: row.lineTax,
    lineTotal: row.lineTotal,
  };
}

export class DrizzleSalesOrderRepository implements ISalesOrderRepository {
  constructor(private readonly db: Database = defaultDb) {}

  async createWithLines(input: CreateSalesOrderInput): Promise<SalesOrder> {
    return this.db.transaction(async (tx) => {
      const [order] = await tx
        .insert(schema.salesOrders)
        .values({
          shopId: input.shopId,
          customerId: input.customerId,
          status: "draft",
          currency: input.currency,
          untaxedAmount: input.untaxedAmount,
          taxAmount: input.taxAmount,
          totalAmount: input.totalAmount,
          orderDate: input.orderDate,
          note: input.note ?? null,
        })
        .returning();

      if (input.lines.length > 0) {
        await tx.insert(schema.salesOrderLines).values(
          input.lines.map((l) => ({
            shopId: input.shopId,
            salesOrderId: order.id,
            productId: l.productId,
            description: l.description,
            qtyOrdered: l.qtyOrdered,
            unitPrice: l.unitPrice,
            taxRateBp: l.taxRateBp,
            lineSubtotal: l.lineSubtotal,
            lineTax: l.lineTax,
            lineTotal: l.lineTotal,
          })),
        );
      }
      return toOrder(order);
    });
  }

  async findById(shopId: string, id: string): Promise<SalesOrderWithLines | null> {
    const order = await this.db.query.salesOrders.findFirst({
      where: and(eq(schema.salesOrders.shopId, shopId), eq(schema.salesOrders.id, id)),
    });
    if (!order) return null;
    const lines = await this.db
      .select()
      .from(schema.salesOrderLines)
      .where(
        and(
          eq(schema.salesOrderLines.shopId, shopId),
          eq(schema.salesOrderLines.salesOrderId, id),
        ),
      );
    return { ...toOrder(order), lines: lines.map(toLine) };
  }

  async list(shopId: string, query: PageQuery): Promise<Page<SalesOrder>> {
    const { offset, limit } = toOffsetLimit(query);
    const filters = [eq(schema.salesOrders.shopId, shopId)];
    if (query.status) {
      filters.push(eq(schema.salesOrders.status, query.status as SalesOrder["status"]));
    }
    const where = and(...filters);

    const [items, [{ total }]] = await Promise.all([
      this.db
        .select()
        .from(schema.salesOrders)
        .where(where)
        .orderBy(desc(schema.salesOrders.createdAt))
        .limit(limit)
        .offset(offset),
      this.db.select({ total: count() }).from(schema.salesOrders).where(where),
    ]);
    return { items: items.map(toOrder), total, page: query.page, pageSize: limit };
  }

  async update(
    shopId: string,
    id: string,
    patch: SalesOrderHeaderPatch,
  ): Promise<SalesOrder> {
    const [row] = await this.db
      .update(schema.salesOrders)
      .set({
        ...(patch.docNumber !== undefined && { docNumber: patch.docNumber }),
        ...(patch.status !== undefined && { status: patch.status }),
        ...(patch.confirmedAt !== undefined && { confirmedAt: patch.confirmedAt }),
      })
      .where(and(eq(schema.salesOrders.shopId, shopId), eq(schema.salesOrders.id, id)))
      .returning();
    return toOrder(row);
  }

  async updateLines(shopId: string, updates: SalesLineProgressPatch[]): Promise<void> {
    await this.db.transaction(async (tx) => {
      for (const u of updates) {
        await tx
          .update(schema.salesOrderLines)
          .set({
            ...(u.qtyDelivered !== undefined && { qtyDelivered: u.qtyDelivered }),
            ...(u.qtyInvoiced !== undefined && { qtyInvoiced: u.qtyInvoiced }),
          })
          .where(
            and(
              eq(schema.salesOrderLines.shopId, shopId),
              eq(schema.salesOrderLines.id, u.id),
            ),
          );
      }
    });
  }
}
