import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { id, createdAt } from "./_shared";
import { shops } from "./shops";
import { partners } from "./partners";

// บันทึกการส่งใบทวงหนี้ (dunning) — outbox อย่างง่าย
export const dunningLogs = sqliteTable(
  "dunning_logs",
  {
    id: id(),
    shopId: text()
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    customerId: text()
      .notNull()
      .references(() => partners.id),
    amount: integer({ mode: "number" }).notNull().default(0),
    note: text(),
    sentAt: text().notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("dunning_logs_shop_customer_idx").on(t.shopId, t.customerId)],
);
