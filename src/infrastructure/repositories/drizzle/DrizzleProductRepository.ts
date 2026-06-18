import "server-only";
import { and, eq, or, like, desc, count, type SQL } from "drizzle-orm";

import { db as defaultDb, schema, type Database } from "@/src/infrastructure/db/client";
import type { Product } from "@/src/domain/entities";
import type {
  CreateProductInput,
  UpdateProductInput,
  IProductRepository,
} from "@/src/application/repositories/IProductRepository";
import type { Page, PageQuery } from "@/src/application/repositories/pagination";
import { toOffsetLimit } from "@/src/application/repositories/pagination";

type Row = typeof schema.products.$inferSelect;

function toProduct(row: Row): Product {
  return {
    id: row.id,
    shopId: row.shopId,
    sku: row.sku,
    name: row.name,
    type: row.type,
    salePrice: row.salePrice,
    costPrice: row.costPrice,
    taxRateBp: row.taxRateBp,
    uom: row.uom,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleProductRepository implements IProductRepository {
  constructor(private readonly db: Database = defaultDb) {}

  async create(input: CreateProductInput): Promise<Product> {
    const [row] = await this.db.insert(schema.products).values(input).returning();
    return toProduct(row);
  }

  async findById(shopId: string, id: string): Promise<Product | null> {
    const row = await this.db.query.products.findFirst({
      where: and(eq(schema.products.shopId, shopId), eq(schema.products.id, id)),
    });
    return row ? toProduct(row) : null;
  }

  async findBySku(shopId: string, sku: string): Promise<Product | null> {
    const row = await this.db.query.products.findFirst({
      where: and(eq(schema.products.shopId, shopId), eq(schema.products.sku, sku)),
    });
    return row ? toProduct(row) : null;
  }

  async list(shopId: string, query: PageQuery): Promise<Page<Product>> {
    const { offset, limit } = toOffsetLimit(query);
    const filters: SQL[] = [eq(schema.products.shopId, shopId)];
    if (query.search) {
      const term = `%${query.search}%`;
      const m = or(like(schema.products.name, term), like(schema.products.sku, term));
      if (m) filters.push(m);
    }
    const where = and(...filters);

    const [items, [{ total }]] = await Promise.all([
      this.db
        .select()
        .from(schema.products)
        .where(where)
        .orderBy(desc(schema.products.createdAt))
        .limit(limit)
        .offset(offset),
      this.db.select({ total: count() }).from(schema.products).where(where),
    ]);

    return { items: items.map(toProduct), total, page: query.page, pageSize: limit };
  }

  async update(shopId: string, id: string, input: UpdateProductInput): Promise<Product> {
    const [row] = await this.db
      .update(schema.products)
      .set({
        ...(input.sku !== undefined && { sku: input.sku }),
        ...(input.name !== undefined && { name: input.name }),
        ...(input.type !== undefined && { type: input.type }),
        ...(input.salePrice !== undefined && { salePrice: input.salePrice }),
        ...(input.costPrice !== undefined && { costPrice: input.costPrice }),
        ...(input.taxRateBp !== undefined && { taxRateBp: input.taxRateBp }),
        ...(input.uom !== undefined && { uom: input.uom }),
      })
      .where(and(eq(schema.products.shopId, shopId), eq(schema.products.id, id)))
      .returning();
    return toProduct(row);
  }

  async setActive(shopId: string, id: string, isActive: boolean): Promise<Product> {
    const [row] = await this.db
      .update(schema.products)
      .set({ isActive })
      .where(and(eq(schema.products.shopId, shopId), eq(schema.products.id, id)))
      .returning();
    return toProduct(row);
  }
}
