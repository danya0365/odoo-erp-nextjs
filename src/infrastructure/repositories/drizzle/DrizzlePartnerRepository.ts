import "server-only";
import { and, eq, or, like, desc, count, inArray, type SQL } from "drizzle-orm";

import { db as defaultDb, schema, type Database } from "@/src/infrastructure/db/client";
import type { Partner } from "@/src/domain/entities";
import type {
  CreatePartnerInput,
  UpdatePartnerInput,
  IPartnerRepository,
} from "@/src/application/repositories/IPartnerRepository";
import type { Page, PageQuery } from "@/src/application/repositories/pagination";
import { toOffsetLimit } from "@/src/application/repositories/pagination";

type Row = typeof schema.partners.$inferSelect;

function toPartner(row: Row): Partner {
  return {
    id: row.id,
    shopId: row.shopId,
    name: row.name,
    type: row.type,
    email: row.email,
    phone: row.phone,
    taxId: row.taxId,
    street: row.street,
    city: row.city,
    country: row.country,
    isCompany: row.isCompany,
    creditTermDays: row.creditTermDays,
    parentId: row.parentId,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzlePartnerRepository implements IPartnerRepository {
  constructor(private readonly db: Database = defaultDb) {}

  async create(input: CreatePartnerInput): Promise<Partner> {
    const [row] = await this.db
      .insert(schema.partners)
      .values({
        shopId: input.shopId,
        name: input.name,
        type: input.type,
        email: input.email ?? null,
        phone: input.phone ?? null,
        taxId: input.taxId ?? null,
        street: input.street ?? null,
        city: input.city ?? null,
        country: input.country ?? null,
        isCompany: input.isCompany ?? false,
        creditTermDays: input.creditTermDays ?? null,
        parentId: input.parentId ?? null,
      })
      .returning();
    return toPartner(row);
  }

  async findById(shopId: string, id: string): Promise<Partner | null> {
    const row = await this.db.query.partners.findFirst({
      where: and(eq(schema.partners.shopId, shopId), eq(schema.partners.id, id)),
    });
    return row ? toPartner(row) : null;
  }

  async findByEmail(shopId: string, email: string): Promise<Partner | null> {
    const row = await this.db.query.partners.findFirst({
      where: and(eq(schema.partners.shopId, shopId), eq(schema.partners.email, email)),
    });
    return row ? toPartner(row) : null;
  }

  async list(shopId: string, query: PageQuery): Promise<Page<Partner>> {
    const { offset, limit } = toOffsetLimit(query);
    const filters: SQL[] = [eq(schema.partners.shopId, shopId)];

    if (query.search) {
      const term = `%${query.search}%`;
      const m = or(like(schema.partners.name, term), like(schema.partners.email, term));
      if (m) filters.push(m);
    }
    // filter ตามชนิด: customer → [customer, both]; vendor → [vendor, both]
    if (query.status === "customer") {
      filters.push(inArray(schema.partners.type, ["customer", "both"]));
    } else if (query.status === "vendor") {
      filters.push(inArray(schema.partners.type, ["vendor", "both"]));
    }

    const where = and(...filters);

    const [items, [{ total }]] = await Promise.all([
      this.db
        .select()
        .from(schema.partners)
        .where(where)
        .orderBy(desc(schema.partners.createdAt))
        .limit(limit)
        .offset(offset),
      this.db.select({ total: count() }).from(schema.partners).where(where),
    ]);

    return {
      items: items.map(toPartner),
      total,
      page: query.page,
      pageSize: limit,
    };
  }

  async update(shopId: string, id: string, input: UpdatePartnerInput): Promise<Partner> {
    const [row] = await this.db
      .update(schema.partners)
      .set({
        ...(input.name !== undefined && { name: input.name }),
        ...(input.type !== undefined && { type: input.type }),
        ...(input.email !== undefined && { email: input.email }),
        ...(input.phone !== undefined && { phone: input.phone }),
        ...(input.taxId !== undefined && { taxId: input.taxId }),
        ...(input.street !== undefined && { street: input.street }),
        ...(input.city !== undefined && { city: input.city }),
        ...(input.country !== undefined && { country: input.country }),
        ...(input.isCompany !== undefined && { isCompany: input.isCompany }),
        ...(input.creditTermDays !== undefined && { creditTermDays: input.creditTermDays }),
        ...(input.parentId !== undefined && { parentId: input.parentId }),
      })
      .where(and(eq(schema.partners.shopId, shopId), eq(schema.partners.id, id)))
      .returning();
    return toPartner(row);
  }

  async setActive(shopId: string, id: string, isActive: boolean): Promise<Partner> {
    const [row] = await this.db
      .update(schema.partners)
      .set({ isActive })
      .where(and(eq(schema.partners.shopId, shopId), eq(schema.partners.id, id)))
      .returning();
    return toPartner(row);
  }
}
