import { sqliteTable, text, unique } from "drizzle-orm/sqlite-core";
import { id, createdAt, updatedAt } from "./_shared";
import { shops } from "./shops";

export const JOURNAL_TYPES = ["sale", "purchase", "bank", "general"] as const;

export const journals = sqliteTable(
  "journals",
  {
    id: id(),
    shopId: text()
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    code: text().notNull(),
    name: text().notNull(),
    type: text({ enum: JOURNAL_TYPES }).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [unique("journals_shop_code_uq").on(t.shopId, t.code)],
);
