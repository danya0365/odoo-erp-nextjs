import "server-only";
import { and, desc, eq, count } from "drizzle-orm";

import { db as defaultDb, schema, type Database } from "@/src/infrastructure/db/client";
import type { Project, ProjectStatus } from "@/src/domain/entities";
import type {
  CreateProjectInput,
  IProjectRepository,
} from "@/src/application/repositories/IProjectRepository";
import type { Page, PageQuery } from "@/src/application/repositories/pagination";
import { toOffsetLimit } from "@/src/application/repositories/pagination";

type Row = typeof schema.projects.$inferSelect;

function toProject(row: Row): Project {
  return {
    id: row.id,
    shopId: row.shopId,
    name: row.name,
    customerId: row.customerId,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleProjectRepository implements IProjectRepository {
  constructor(private readonly db: Database = defaultDb) {}

  async create(input: CreateProjectInput): Promise<Project> {
    const [row] = await this.db
      .insert(schema.projects)
      .values({ shopId: input.shopId, name: input.name, customerId: input.customerId ?? null })
      .returning();
    return toProject(row);
  }

  async findById(shopId: string, id: string): Promise<Project | null> {
    const row = await this.db.query.projects.findFirst({
      where: and(eq(schema.projects.shopId, shopId), eq(schema.projects.id, id)),
    });
    return row ? toProject(row) : null;
  }

  async list(shopId: string, query: PageQuery): Promise<Page<Project>> {
    const { offset, limit } = toOffsetLimit(query);
    const where = eq(schema.projects.shopId, shopId);
    const [items, [{ total }]] = await Promise.all([
      this.db.select().from(schema.projects).where(where).orderBy(desc(schema.projects.createdAt)).limit(limit).offset(offset),
      this.db.select({ total: count() }).from(schema.projects).where(where),
    ]);
    return { items: items.map(toProject), total, page: query.page, pageSize: limit };
  }

  async setStatus(shopId: string, id: string, status: ProjectStatus): Promise<Project> {
    const [row] = await this.db
      .update(schema.projects)
      .set({ status })
      .where(and(eq(schema.projects.shopId, shopId), eq(schema.projects.id, id)))
      .returning();
    return toProject(row);
  }
}
