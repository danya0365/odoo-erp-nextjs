import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { id, createdAt, updatedAt } from "./_shared";
import { shops } from "./shops";
import { partners } from "./partners";
import { employees } from "./hr";

export const PROJECT_STATUSES = ["active", "closed"] as const;
export const TASK_STATUSES = ["todo", "in_progress", "done"] as const;

export const projects = sqliteTable(
  "projects",
  {
    id: id(),
    shopId: text()
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    name: text().notNull(),
    customerId: text().references(() => partners.id),
    status: text({ enum: PROJECT_STATUSES }).notNull().default("active"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("projects_shop_status_idx").on(t.shopId, t.status)],
);

export const projectTasks = sqliteTable(
  "project_tasks",
  {
    id: id(),
    shopId: text()
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    projectId: text()
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    name: text().notNull(),
    status: text({ enum: TASK_STATUSES }).notNull().default("todo"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("project_tasks_shop_project_idx").on(t.shopId, t.projectId)],
);

export const timesheets = sqliteTable(
  "timesheets",
  {
    id: id(),
    shopId: text()
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    projectId: text()
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    taskId: text().references(() => projectTasks.id, { onDelete: "set null" }),
    employeeId: text()
      .notNull()
      .references(() => employees.id),
    date: text().notNull(),
    minutes: integer({ mode: "number" }).notNull(),
    note: text(),
    createdAt: createdAt(),
  },
  (t) => [index("timesheets_shop_project_idx").on(t.shopId, t.projectId)],
);
