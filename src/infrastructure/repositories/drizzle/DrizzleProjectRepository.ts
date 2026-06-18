import "server-only";
import { and, desc, eq } from "drizzle-orm";

import { db as defaultDb, schema, type Database } from "@/src/infrastructure/db/client";
import type { Project, ProjectStatus } from "@/src/domain/entities";
import type {
  CreateProjectInput,
  IProjectRepository,
} from "@/src/application/repositories/IProjectRepository";

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

  async list(shopId: string): Promise<Project[]> {
    const rows = await this.db
      .select()
      .from(schema.projects)
      .where(eq(schema.projects.shopId, shopId))
      .orderBy(desc(schema.projects.createdAt));
    return rows.map(toProject);
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
