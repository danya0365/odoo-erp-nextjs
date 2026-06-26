import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { id, createdAt } from "./_shared";
import { shops } from "./shops";
import { products } from "./products";
import { stockLocations } from "./stock-locations";

export const STOCK_MOVE_TYPES = ["in", "out", "adjust"] as const;
export const STOCK_SOURCE_TYPES = ["adjustment", "delivery", "receipt", "transfer", "manufacturing", "sales_return", "stocktake", "purchase_return"] as const;

// ledger เพิ่มอย่างเดียว — on-hand = SUM(qtyDelta) ต่อ product (ไม่มีคอลัมน์ on-hand)
export const stockMoves = sqliteTable(
  "stock_moves",
  {
    id: id(),
    shopId: text()
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    productId: text()
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    locationId: text()
      .notNull()
      .references(() => stockLocations.id, { onDelete: "cascade" }),
    qtyDelta: integer({ mode: "number" }).notNull(), // signed, scale QTY_SCALE
    type: text({ enum: STOCK_MOVE_TYPES }).notNull(),
    sourceType: text({ enum: STOCK_SOURCE_TYPES }).notNull(),
    sourceId: text(),
    note: text(),
    createdAt: createdAt(),
  },
  (t) => [
    index("stock_moves_shop_product_idx").on(t.shopId, t.productId),
    index("stock_moves_shop_source_idx").on(t.shopId, t.sourceType, t.sourceId),
  ],
);
