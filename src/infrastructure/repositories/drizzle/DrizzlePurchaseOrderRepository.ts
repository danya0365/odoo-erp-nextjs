import "server-only";
import { and, eq, desc, count } from "drizzle-orm";

import { db as defaultDb, schema, type Database } from "@/src/infrastructure/db/client";
import type {
  PurchaseOrder,
  PurchaseOrderLine,
  PurchaseOrderWithLines,
} from "@/src/domain/entities";
import type {
  CreatePurchaseOrderInput,
  PurchaseOrderHeaderPatch,
  PurchaseLineProgressPatch,
  IPurchaseOrderRepository,
} from "@/src/application/repositories/IPurchaseOrderRepository";
import type { Page, PageQuery } from "@/src/application/repositories/pagination";
import { toOffsetLimit } from "@/src/application/repositories/pagination";

type OrderRow = typeof schema.purchaseOrders.$inferSelect;
type LineRow = typeof schema.purchaseOrderLines.$inferSelect;

function toOrder(row: OrderRow): PurchaseOrder {
  return {
    id: row.id,
    shopId: row.shopId,
    docNumber: row.docNumber,
    vendorId: row.vendorId,
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

function toLine(row: LineRow): PurchaseOrderLine {
  return {
    id: row.id,
    shopId: row.shopId,
    purchaseOrderId: row.purchaseOrderId,
    productId: row.productId,
    description: row.description,
    qtyOrdered: row.qtyOrdered,
    qtyReceived: row.qtyReceived,
    qtyBilled: row.qtyBilled,
    unitPrice: row.unitPrice,
    taxRateBp: row.taxRateBp,
    lineSubtotal: row.lineSubtotal,
    lineTax: row.lineTax,
    lineTotal: row.lineTotal,
  };
}

export class DrizzlePurchaseOrderRepository implements IPurchaseOrderRepository {
  constructor(private readonly db: Database = defaultDb) {}

  async createWithLines(input: CreatePurchaseOrderInput): Promise<PurchaseOrder> {
    return this.db.transaction(async (tx) => {
      const [order] = await tx
        .insert(schema.purchaseOrders)
        .values({
          shopId: input.shopId,
          vendorId: input.vendorId,
          status: "rfq",
          currency: input.currency,
          untaxedAmount: input.untaxedAmount,
          taxAmount: input.taxAmount,
          totalAmount: input.totalAmount,
          orderDate: input.orderDate,
          note: input.note ?? null,
        })
        .returning();
      if (input.lines.length > 0) {
        await tx.insert(schema.purchaseOrderLines).values(
          input.lines.map((l) => ({
            shopId: input.shopId,
            purchaseOrderId: order.id,
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

  async findById(shopId: string, id: string): Promise<PurchaseOrderWithLines | null> {
    const order = await this.db.query.purchaseOrders.findFirst({
      where: and(
        eq(schema.purchaseOrders.shopId, shopId),
        eq(schema.purchaseOrders.id, id),
      ),
    });
    if (!order) return null;
    const lines = await this.db
      .select()
      .from(schema.purchaseOrderLines)
      .where(
        and(
          eq(schema.purchaseOrderLines.shopId, shopId),
          eq(schema.purchaseOrderLines.purchaseOrderId, id),
        ),
      );
    return { ...toOrder(order), lines: lines.map(toLine) };
  }

  async list(shopId: string, query: PageQuery): Promise<Page<PurchaseOrder>> {
    const { offset, limit } = toOffsetLimit(query);
    const filters = [eq(schema.purchaseOrders.shopId, shopId)];
    if (query.status) {
      filters.push(
        eq(schema.purchaseOrders.status, query.status as PurchaseOrder["status"]),
      );
    }
    const where = and(...filters);
    const [items, [{ total }]] = await Promise.all([
      this.db
        .select()
        .from(schema.purchaseOrders)
        .where(where)
        .orderBy(desc(schema.purchaseOrders.createdAt))
        .limit(limit)
        .offset(offset),
      this.db.select({ total: count() }).from(schema.purchaseOrders).where(where),
    ]);
    return { items: items.map(toOrder), total, page: query.page, pageSize: limit };
  }

  async update(
    shopId: string,
    id: string,
    patch: PurchaseOrderHeaderPatch,
  ): Promise<PurchaseOrder> {
    const [row] = await this.db
      .update(schema.purchaseOrders)
      .set({
        ...(patch.docNumber !== undefined && { docNumber: patch.docNumber }),
        ...(patch.status !== undefined && { status: patch.status }),
        ...(patch.confirmedAt !== undefined && { confirmedAt: patch.confirmedAt }),
      })
      .where(
        and(eq(schema.purchaseOrders.shopId, shopId), eq(schema.purchaseOrders.id, id)),
      )
      .returning();
    return toOrder(row);
  }

  async updateLines(shopId: string, updates: PurchaseLineProgressPatch[]): Promise<void> {
    await this.db.transaction(async (tx) => {
      for (const u of updates) {
        await tx
          .update(schema.purchaseOrderLines)
          .set({
            ...(u.qtyReceived !== undefined && { qtyReceived: u.qtyReceived }),
            ...(u.qtyBilled !== undefined && { qtyBilled: u.qtyBilled }),
          })
          .where(
            and(
              eq(schema.purchaseOrderLines.shopId, shopId),
              eq(schema.purchaseOrderLines.id, u.id),
            ),
          );
      }
    });
  }
}
