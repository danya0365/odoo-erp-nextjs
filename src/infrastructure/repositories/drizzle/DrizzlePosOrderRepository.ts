import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";

import { db as defaultDb, schema, type Database } from "@/src/infrastructure/db/client";
import type { PosOrder, PosOrderLine, PosOrderWithLines } from "@/src/domain/entities";
import type {
  CreatePosOrderInput,
  IPosOrderRepository,
} from "@/src/application/repositories/IPosOrderRepository";

type Row = typeof schema.posOrders.$inferSelect;
type LineRow = typeof schema.posOrderLines.$inferSelect;

function toOrder(row: Row): PosOrder {
  return {
    id: row.id,
    shopId: row.shopId,
    sessionId: row.sessionId,
    docNumber: row.docNumber,
    untaxedAmount: row.untaxedAmount,
    taxAmount: row.taxAmount,
    totalAmount: row.totalAmount,
    paymentMethod: row.paymentMethod,
    createdAt: row.createdAt,
  };
}

function toLine(row: LineRow): PosOrderLine {
  return {
    id: row.id,
    shopId: row.shopId,
    posOrderId: row.posOrderId,
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

export class DrizzlePosOrderRepository implements IPosOrderRepository {
  constructor(private readonly db: Database = defaultDb) {}

  async createWithLines(input: CreatePosOrderInput): Promise<PosOrder> {
    return this.db.transaction(async (tx) => {
      const [order] = await tx
        .insert(schema.posOrders)
        .values({
          shopId: input.shopId,
          sessionId: input.sessionId,
          docNumber: input.docNumber,
          untaxedAmount: input.untaxedAmount,
          taxAmount: input.taxAmount,
          totalAmount: input.totalAmount,
          paymentMethod: input.paymentMethod,
        })
        .returning();
      if (input.lines.length > 0) {
        await tx.insert(schema.posOrderLines).values(
          input.lines.map((l) => ({
            shopId: input.shopId,
            posOrderId: order.id,
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
      return toOrder(order);
    });
  }

  async findById(shopId: string, id: string): Promise<PosOrderWithLines | null> {
    const order = await this.db.query.posOrders.findFirst({
      where: and(eq(schema.posOrders.shopId, shopId), eq(schema.posOrders.id, id)),
    });
    if (!order) return null;
    const lines = await this.db
      .select()
      .from(schema.posOrderLines)
      .where(
        and(eq(schema.posOrderLines.shopId, shopId), eq(schema.posOrderLines.posOrderId, id)),
      );
    return { ...toOrder(order), lines: lines.map(toLine) };
  }

  async listBySession(shopId: string, sessionId: string): Promise<PosOrder[]> {
    const rows = await this.db
      .select()
      .from(schema.posOrders)
      .where(
        and(eq(schema.posOrders.shopId, shopId), eq(schema.posOrders.sessionId, sessionId)),
      )
      .orderBy(desc(schema.posOrders.createdAt));
    return rows.map(toOrder);
  }

  async cashTotalBySession(shopId: string, sessionId: string): Promise<number> {
    const [row] = await this.db
      .select({ total: sql<number>`coalesce(sum(${schema.posOrders.totalAmount}), 0)` })
      .from(schema.posOrders)
      .where(
        and(
          eq(schema.posOrders.shopId, shopId),
          eq(schema.posOrders.sessionId, sessionId),
          eq(schema.posOrders.paymentMethod, "cash"),
        ),
      );
    return Number(row?.total ?? 0);
  }
}
