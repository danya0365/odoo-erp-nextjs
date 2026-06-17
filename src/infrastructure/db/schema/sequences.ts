import { sqliteTable, text, integer, unique, index } from "drizzle-orm/sqlite-core";
import { id, createdAt, updatedAt } from "./_shared";
import { shops } from "./shops";

// ตัวนับเลขเอกสารต่อ shop ต่อชนิด (key เช่น "sales_order", "invoice")
// increment อะตอมมิกผ่าน INSERT ... ON CONFLICT DO UPDATE RETURNING (libSQL single-writer)
export const sequences = sqliteTable(
  "sequences",
  {
    id: id(),
    shopId: text()
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    key: text().notNull(),
    next: integer({ mode: "number" }).notNull().default(1),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    unique("sequences_shop_key_uq").on(t.shopId, t.key),
    index("sequences_shop_idx").on(t.shopId),
  ],
);
