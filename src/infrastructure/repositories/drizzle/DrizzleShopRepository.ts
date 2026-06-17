import "server-only";
import { eq } from "drizzle-orm";

import { db as defaultDb, schema, type Database } from "@/src/infrastructure/db/client";
import type { Shop } from "@/src/domain/entities";
import type {
  CreateShopInput,
  IShopRepository,
} from "@/src/application/repositories/IShopRepository";

type Row = typeof schema.shops.$inferSelect;

function toShop(row: Row): Shop {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleShopRepository implements IShopRepository {
  constructor(private readonly db: Database = defaultDb) {}

  async create(input: CreateShopInput): Promise<Shop> {
    const [row] = await this.db
      .insert(schema.shops)
      .values({ name: input.name, slug: input.slug })
      .returning();
    return toShop(row);
  }

  async findById(id: string): Promise<Shop | null> {
    const row = await this.db.query.shops.findFirst({
      where: eq(schema.shops.id, id),
    });
    return row ? toShop(row) : null;
  }

  async findBySlug(slug: string): Promise<Shop | null> {
    const row = await this.db.query.shops.findFirst({
      where: eq(schema.shops.slug, slug),
    });
    return row ? toShop(row) : null;
  }
}
