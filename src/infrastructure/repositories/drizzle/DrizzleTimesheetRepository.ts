import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";

import { db as defaultDb, schema, type Database } from "@/src/infrastructure/db/client";
import type { Timesheet } from "@/src/domain/entities";
import type {
  CreateTimesheetInput,
  ITimesheetRepository,
  MinutesByTaskRow,
} from "@/src/application/repositories/ITimesheetRepository";

type Row = typeof schema.timesheets.$inferSelect;

function toTimesheet(row: Row): Timesheet {
  return {
    id: row.id,
    shopId: row.shopId,
    projectId: row.projectId,
    taskId: row.taskId,
    employeeId: row.employeeId,
    date: row.date,
    minutes: row.minutes,
    note: row.note,
    createdAt: row.createdAt,
  };
}

export class DrizzleTimesheetRepository implements ITimesheetRepository {
  constructor(private readonly db: Database = defaultDb) {}

  async create(input: CreateTimesheetInput): Promise<Timesheet> {
    const [row] = await this.db
      .insert(schema.timesheets)
      .values({
        shopId: input.shopId,
        projectId: input.projectId,
        taskId: input.taskId ?? null,
        employeeId: input.employeeId,
        date: input.date,
        minutes: input.minutes,
        note: input.note ?? null,
      })
      .returning();
    return toTimesheet(row);
  }

  async listByProject(shopId: string, projectId: string): Promise<Timesheet[]> {
    const rows = await this.db
      .select()
      .from(schema.timesheets)
      .where(
        and(eq(schema.timesheets.shopId, shopId), eq(schema.timesheets.projectId, projectId)),
      )
      .orderBy(desc(schema.timesheets.date), desc(schema.timesheets.createdAt));
    return rows.map(toTimesheet);
  }

  async totalMinutesByProject(shopId: string, projectId: string): Promise<number> {
    const [row] = await this.db
      .select({ total: sql<number>`coalesce(sum(${schema.timesheets.minutes}), 0)` })
      .from(schema.timesheets)
      .where(
        and(eq(schema.timesheets.shopId, shopId), eq(schema.timesheets.projectId, projectId)),
      );
    return Number(row?.total ?? 0);
  }

  async minutesByTask(shopId: string, projectId: string): Promise<MinutesByTaskRow[]> {
    const rows = await this.db
      .select({
        taskId: schema.timesheets.taskId,
        minutes: sql<number>`coalesce(sum(${schema.timesheets.minutes}), 0)`,
      })
      .from(schema.timesheets)
      .where(
        and(eq(schema.timesheets.shopId, shopId), eq(schema.timesheets.projectId, projectId)),
      )
      .groupBy(schema.timesheets.taskId);
    return rows.map((r) => ({ taskId: r.taskId, minutes: Number(r.minutes) }));
  }
}
