import { sqliteTable, text, integer, index, unique } from "drizzle-orm/sqlite-core";
import { id, createdAt, updatedAt } from "./_shared";
import { shops } from "./shops";

export const PAYROLL_RUN_STATUSES = ["draft", "posted"] as const;

export const employees = sqliteTable(
  "employees",
  {
    id: id(),
    shopId: text()
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    name: text().notNull(),
    position: text(),
    baseSalary: integer({ mode: "number" }).notNull().default(0), // minor units
    isActive: integer({ mode: "boolean" }).notNull().default(true),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("employees_shop_active_idx").on(t.shopId, t.isActive)],
);

export const payrollRuns = sqliteTable(
  "payroll_runs",
  {
    id: id(),
    shopId: text()
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    docNumber: text(),
    period: text().notNull(), // 'YYYY-MM'
    whtRateBp: integer({ mode: "number" }).notNull().default(0),
    status: text({ enum: PAYROLL_RUN_STATUSES }).notNull().default("draft"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("payroll_runs_shop_status_idx").on(t.shopId, t.status),
    unique("payroll_runs_shop_doc_uq").on(t.shopId, t.docNumber),
  ],
);

export const payslips = sqliteTable(
  "payslips",
  {
    id: id(),
    shopId: text()
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    runId: text()
      .notNull()
      .references(() => payrollRuns.id, { onDelete: "cascade" }),
    employeeId: text()
      .notNull()
      .references(() => employees.id),
    gross: integer({ mode: "number" }).notNull(),
    tax: integer({ mode: "number" }).notNull(),
    net: integer({ mode: "number" }).notNull(),
  },
  (t) => [index("payslips_shop_run_idx").on(t.shopId, t.runId)],
);
