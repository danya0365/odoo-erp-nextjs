import "server-only";
import { and, asc, eq } from "drizzle-orm";

import { db as defaultDb, schema, type Database } from "@/src/infrastructure/db/client";
import type { ProjectTask, TaskStatus } from "@/src/domain/entities";
import type {
  CreateTaskInput,
  IProjectTaskRepository,
} from "@/src/application/repositories/IProjectTaskRepository";

type Row = typeof schema.projectTasks.$inferSelect;

function toTask(row: Row): ProjectTask {
  return {
    id: row.id,
    shopId: row.shopId,
    projectId: row.projectId,
    name: row.name,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleProjectTaskRepository implements IProjectTaskRepository {
  constructor(private readonly db: Database = defaultDb) {}

  async create(input: CreateTaskInput): Promise<ProjectTask> {
    const [row] = await this.db
      .insert(schema.projectTasks)
      .values({ shopId: input.shopId, projectId: input.projectId, name: input.name })
      .returning();
    return toTask(row);
  }

  async findById(shopId: string, id: string): Promise<ProjectTask | null> {
    const row = await this.db.query.projectTasks.findFirst({
      where: and(eq(schema.projectTasks.shopId, shopId), eq(schema.projectTasks.id, id)),
    });
    return row ? toTask(row) : null;
  }

  async listByProject(shopId: string, projectId: string): Promise<ProjectTask[]> {
    const rows = await this.db
      .select()
      .from(schema.projectTasks)
      .where(
        and(eq(schema.projectTasks.shopId, shopId), eq(schema.projectTasks.projectId, projectId)),
      )
      .orderBy(asc(schema.projectTasks.createdAt));
    return rows.map(toTask);
  }

  async setStatus(shopId: string, id: string, status: TaskStatus): Promise<ProjectTask> {
    const [row] = await this.db
      .update(schema.projectTasks)
      .set({ status })
      .where(and(eq(schema.projectTasks.shopId, shopId), eq(schema.projectTasks.id, id)))
      .returning();
    return toTask(row);
  }
}
