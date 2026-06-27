import { sqliteTable, text, integer, index, unique } from "drizzle-orm/sqlite-core";
import { id, createdAt, updatedAt } from "./_shared";
import { shops } from "./shops";
import { employees } from "./hr";

export const EXPENSE_CLAIM_STATUSES = ["submitted", "approved", "paid", "rejected"] as const;

// ใบเบิกค่าใช้จ่ายพนักงาน
export const expenseClaims = sqliteTable(
  "expense_claims",
  {
    id: id(),
    shopId: text()
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    docNumber: text().notNull(),
    employeeId: text()
      .notNull()
      .references(() => employees.id),
    category: text().notNull().default(""),
    description: text().notNull().default(""),
    amount: integer({ mode: "number" }).notNull().default(0),
    status: text({ enum: EXPENSE_CLAIM_STATUSES }).notNull().default("submitted"),
    paidAt: text(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("expense_claims_shop_status_idx").on(t.shopId, t.status),
    unique("expense_claims_shop_doc_uq").on(t.shopId, t.docNumber),
  ],
);
