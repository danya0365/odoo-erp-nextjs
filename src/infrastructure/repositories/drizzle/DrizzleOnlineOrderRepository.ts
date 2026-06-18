import "server-only";
import { and, desc, eq } from "drizzle-orm";

import { db as defaultDb, schema, type Database } from "@/src/infrastructure/db/client";
import type { OnlineOrder } from "@/src/domain/entities";
import type {
  CreateOnlineOrderInput,
  IOnlineOrderRepository,
} from "@/src/application/repositories/IOnlineOrderRepository";

type Row = typeof schema.onlineOrders.$inferSelect;

function toOrder(row: Row): OnlineOrder {
  return {
    id: row.id,
    shopId: row.shopId,
    orderNumber: row.orderNumber,
    customerName: row.customerName,
    email: row.email,
    phone: row.phone,
    salesOrderId: row.salesOrderId,
    totalAmount: row.totalAmount,
    createdAt: row.createdAt,
  };
}

export class DrizzleOnlineOrderRepository implements IOnlineOrderRepository {
  constructor(private readonly db: Database = defaultDb) {}

  async create(input: CreateOnlineOrderInput): Promise<OnlineOrder> {
    const [row] = await this.db
      .insert(schema.onlineOrders)
      .values({
        shopId: input.shopId,
        orderNumber: input.orderNumber,
        customerName: input.customerName,
        email: input.email,
        phone: input.phone ?? null,
        salesOrderId: input.salesOrderId,
        totalAmount: input.totalAmount,
      })
      .returning();
    return toOrder(row);
  }

  async findById(shopId: string, id: string): Promise<OnlineOrder | null> {
    const row = await this.db.query.onlineOrders.findFirst({
      where: and(eq(schema.onlineOrders.shopId, shopId), eq(schema.onlineOrders.id, id)),
    });
    return row ? toOrder(row) : null;
  }

  async list(shopId: string): Promise<OnlineOrder[]> {
    const rows = await this.db
      .select()
      .from(schema.onlineOrders)
      .where(eq(schema.onlineOrders.shopId, shopId))
      .orderBy(desc(schema.onlineOrders.createdAt));
    return rows.map(toOrder);
  }
}
