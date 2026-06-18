import { sqliteTable, text, integer, unique } from "drizzle-orm/sqlite-core";
import { id, createdAt, updatedAt } from "./_shared";
import { shops } from "./shops";
import { products } from "./products";

// จุดสั่งซื้อซ้ำต่อสินค้า (shop-global) — on-hand ≤ min แล้วเติมจนถึง max
export const reorderRules = sqliteTable(
  "reorder_rules",
  {
    id: id(),
    shopId: text()
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    productId: text()
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    minQty: integer({ mode: "number" }).notNull().default(0), // scale QTY_SCALE
    maxQty: integer({ mode: "number" }).notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [unique("reorder_rules_shop_product_uq").on(t.shopId, t.productId)],
);
