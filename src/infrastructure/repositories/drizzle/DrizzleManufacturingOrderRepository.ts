import "server-only";
import { and, desc, eq, count } from "drizzle-orm";

import { db as defaultDb, schema, type Database } from "@/src/infrastructure/db/client";
import type { ManufacturingOrder } from "@/src/domain/entities";
import type {
  CreateManufacturingOrderInput,
  IManufacturingOrderRepository,
  ManufacturingOrderPatch,
} from "@/src/application/repositories/IManufacturingOrderRepository";
import type { Page, PageQuery } from "@/src/application/repositories/pagination";
import { toOffsetLimit } from "@/src/application/repositories/pagination";

type Row = typeof schema.manufacturingOrders.$inferSelect;

function toOrder(row: Row): ManufacturingOrder {
  return {
    id: row.id,
    shopId: row.shopId,
    docNumber: row.docNumber,
    bomId: row.bomId,
    productId: row.productId,
    qty: row.qty,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleManufacturingOrderRepository implements IManufacturingOrderRepository {
  constructor(private readonly db: Database = defaultDb) {}

  async create(input: CreateManufacturingOrderInput): Promise<ManufacturingOrder> {
    const [row] = await this.db
      .insert(schema.manufacturingOrders)
      .values({
        shopId: input.shopId,
        bomId: input.bomId,
        productId: input.productId,
        qty: input.qty,
      })
      .returning();
    return toOrder(row);
  }

  async findById(shopId: string, id: string): Promise<ManufacturingOrder | null> {
    const row = await this.db.query.manufacturingOrders.findFirst({
      where: and(
        eq(schema.manufacturingOrders.shopId, shopId),
        eq(schema.manufacturingOrders.id, id),
      ),
    });
    return row ? toOrder(row) : null;
  }

  async list(shopId: string, query: PageQuery): Promise<Page<ManufacturingOrder>> {
    const { offset, limit } = toOffsetLimit(query);
    const filters = [eq(schema.manufacturingOrders.shopId, shopId)];
    if (query.status) filters.push(eq(schema.manufacturingOrders.status, query.status as Row["status"]));
    const where = and(...filters);
    const [items, [{ total }]] = await Promise.all([
      this.db
        .select()
        .from(schema.manufacturingOrders)
        .where(where)
        .orderBy(desc(schema.manufacturingOrders.createdAt))
        .limit(limit)
        .offset(offset),
      this.db.select({ total: count() }).from(schema.manufacturingOrders).where(where),
    ]);
    return { items: items.map(toOrder), total, page: query.page, pageSize: limit };
  }

  async update(
    shopId: string,
    id: string,
    patch: ManufacturingOrderPatch,
  ): Promise<ManufacturingOrder> {
    const [row] = await this.db
      .update(schema.manufacturingOrders)
      .set({
        ...(patch.docNumber !== undefined && { docNumber: patch.docNumber }),
        ...(patch.status !== undefined && { status: patch.status }),
      })
      .where(
        and(
          eq(schema.manufacturingOrders.shopId, shopId),
          eq(schema.manufacturingOrders.id, id),
        ),
      )
      .returning();
    return toOrder(row);
  }
}
