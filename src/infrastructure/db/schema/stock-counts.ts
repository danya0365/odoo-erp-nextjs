import { sqliteTable, text, integer, index, unique } from "drizzle-orm/sqlite-core";
import { id, createdAt, updatedAt } from "./_shared";
import { shops } from "./shops";
import { products } from "./products";

export const STOCK_COUNT_STATUSES = ["draft", "applied", "cancelled"] as const;

// รอบตรวจนับสต๊อก
export const stockCounts = sqliteTable(
  "stock_counts",
  {
    id: id(),
    shopId: text()
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    docNumber: text().notNull(),
    status: text({ enum: STOCK_COUNT_STATUSES }).notNull().default("draft"),
    note: text(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("stock_counts_shop_status_idx").on(t.shopId, t.status),
    unique("stock_counts_shop_doc_uq").on(t.shopId, t.docNumber),
  ],
);

export const stockCountLines = sqliteTable(
  "stock_count_lines",
  {
    id: id(),
    shopId: text()
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    stockCountId: text()
      .notNull()
      .references(() => stockCounts.id, { onDelete: "cascade" }),
    productId: text()
      .notNull()
      .references(() => products.id),
    systemQty: integer({ mode: "number" }).notNull().default(0),
    countedQty: integer({ mode: "number" }).notNull().default(0),
  },
  (t) => [index("stock_count_lines_shop_count_idx").on(t.shopId, t.stockCountId)],
);
