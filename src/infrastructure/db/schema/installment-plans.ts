import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { id, createdAt, updatedAt } from "./_shared";
import { shops } from "./shops";
import { partners } from "./partners";
import { invoices } from "./invoices";

export const INSTALLMENT_PLAN_STATUSES = ["active", "completed", "cancelled"] as const;
export const INSTALLMENT_LINE_STATUSES = ["pending", "paid"] as const;

export const installmentPlans = sqliteTable(
  "installment_plans",
  {
    id: id(),
    shopId: text()
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    invoiceId: text()
      .notNull()
      .references(() => invoices.id),
    customerId: text()
      .notNull()
      .references(() => partners.id),
    totalAmount: integer({ mode: "number" }).notNull().default(0),
    status: text({ enum: INSTALLMENT_PLAN_STATUSES }).notNull().default("active"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("installment_plans_shop_status_idx").on(t.shopId, t.status)],
);

export const installmentLines = sqliteTable(
  "installment_lines",
  {
    id: id(),
    shopId: text()
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    installmentPlanId: text()
      .notNull()
      .references(() => installmentPlans.id, { onDelete: "cascade" }),
    seq: integer({ mode: "number" }).notNull(),
    dueDate: text().notNull(),
    amount: integer({ mode: "number" }).notNull(),
    paidAmount: integer({ mode: "number" }).notNull().default(0),
    status: text({ enum: INSTALLMENT_LINE_STATUSES }).notNull().default("pending"),
  },
  (t) => [index("installment_lines_shop_plan_idx").on(t.shopId, t.installmentPlanId)],
);
