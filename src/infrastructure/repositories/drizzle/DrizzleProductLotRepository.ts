import "server-only";
import { and, eq, gt, asc } from "drizzle-orm";

import { db as defaultDb, schema, type Database } from "@/src/infrastructure/db/client";
import type { ProductLot } from "@/src/domain/entities";
import type {
  CreateProductLotInput,
  IProductLotRepository,
} from "@/src/application/repositories/IProductLotRepository";

function toLot(r: typeof schema.productLots.$inferSelect): ProductLot {
  return { id: r.id, shopId: r.shopId, productId: r.productId, lotNumber: r.lotNumber, expiryDate: r.expiryDate, qty: r.qty, createdAt: r.createdAt, updatedAt: r.updatedAt };
}

export class DrizzleProductLotRepository implements IProductLotRepository {
  constructor(private readonly db: Database = defaultDb) {}

  async create(input: CreateProductLotInput): Promise<ProductLot> {
    const [row] = await this.db.insert(schema.productLots).values(input).returning();
    return toLot(row);
  }

  async findById(shopId: string, id: string): Promise<ProductLot | null> {
    const row = await this.db.query.productLots.findFirst({
      where: and(eq(schema.productLots.shopId, shopId), eq(schema.productLots.id, id)),
    });
    return row ? toLot(row) : null;
  }

  async listByProduct(shopId: string, productId: string): Promise<ProductLot[]> {
    const rows = await this.db
      .select()
      .from(schema.productLots)
      .where(and(eq(schema.productLots.shopId, shopId), eq(schema.productLots.productId, productId), gt(schema.productLots.qty, 0)))
      .orderBy(asc(schema.productLots.expiryDate));
    return rows.map(toLot);
  }

  async listAll(shopId: string): Promise<ProductLot[]> {
    const rows = await this.db
      .select()
      .from(schema.productLots)
      .where(eq(schema.productLots.shopId, shopId))
      .orderBy(asc(schema.productLots.expiryDate));
    return rows.map(toLot);
  }

  async setQty(shopId: string, id: string, qty: number): Promise<void> {
    await this.db
      .update(schema.productLots)
      .set({ qty })
      .where(and(eq(schema.productLots.shopId, shopId), eq(schema.productLots.id, id)));
  }
}
