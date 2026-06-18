import { sqliteTable, text, integer, index, unique } from "drizzle-orm/sqlite-core";
import { id, createdAt, updatedAt } from "./_shared";
import { shops } from "./shops";

export const PRODUCT_TYPES = ["stockable", "service", "consumable"] as const;

export const products = sqliteTable(
  "products",
  {
    id: id(),
    shopId: text()
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    sku: text().notNull(),
    name: text().notNull(),
    type: text({ enum: PRODUCT_TYPES }).notNull().default("stockable"),
    salePrice: integer({ mode: "number" }).notNull().default(0), // minor units
    costPrice: integer({ mode: "number" }).notNull().default(0), // minor units
    taxRateBp: integer({ mode: "number" }).notNull().default(0), // basis points
    uom: text().notNull().default("หน่วย"),
    isActive: integer({ mode: "boolean" }).notNull().default(true),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    unique("products_shop_sku_uq").on(t.shopId, t.sku),
    index("products_shop_name_idx").on(t.shopId, t.name),
    index("products_shop_created_idx").on(t.shopId, t.createdAt),
  ],
);
