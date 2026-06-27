import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { id, createdAt, updatedAt } from "./_shared";
import { shops } from "./shops";
import { products } from "./products";

// ล็อตสินค้า + วันหมดอายุ (lot/batch tracking)
export const productLots = sqliteTable(
  "product_lots",
  {
    id: id(),
    shopId: text()
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    productId: text()
      .notNull()
      .references(() => products.id),
    lotNumber: text().notNull().default(""),
    expiryDate: text().notNull(),
    qty: integer({ mode: "number" }).notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("product_lots_shop_product_idx").on(t.shopId, t.productId),
    index("product_lots_shop_expiry_idx").on(t.shopId, t.expiryDate),
  ],
);
