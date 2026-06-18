import { sqliteTable, text, integer, index, unique } from "drizzle-orm/sqlite-core";
import { id, createdAt, updatedAt } from "./_shared";
import { shops } from "./shops";

export const ACCOUNT_TYPES = ["asset", "liability", "equity", "income", "expense"] as const;

export const accounts = sqliteTable(
  "accounts",
  {
    id: id(),
    shopId: text()
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    code: text().notNull(),
    name: text().notNull(),
    type: text({ enum: ACCOUNT_TYPES }).notNull(),
    isActive: integer({ mode: "boolean" }).notNull().default(true),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    unique("accounts_shop_code_uq").on(t.shopId, t.code),
    index("accounts_shop_type_idx").on(t.shopId, t.type),
  ],
);
