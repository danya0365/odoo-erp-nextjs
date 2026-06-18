import { sqliteTable, text, integer, index, unique } from "drizzle-orm/sqlite-core";
import { id, createdAt, updatedAt } from "./_shared";
import { shops } from "./shops";
import { products } from "./products";

export const MANUFACTURING_ORDER_STATUSES = ["draft", "confirmed", "done", "cancelled"] as const;

export const boms = sqliteTable(
  "boms",
  {
    id: id(),
    shopId: text()
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    productId: text()
      .notNull()
      .references(() => products.id),
    name: text().notNull(),
    isActive: integer({ mode: "boolean" }).notNull().default(true),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("boms_shop_product_idx").on(t.shopId, t.productId)],
);

export const bomLines = sqliteTable(
  "bom_lines",
  {
    id: id(),
    shopId: text()
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    bomId: text()
      .notNull()
      .references(() => boms.id, { onDelete: "cascade" }),
    componentId: text()
      .notNull()
      .references(() => products.id),
    qtyPerUnit: integer({ mode: "number" }).notNull(), // scale QTY_SCALE
  },
  (t) => [index("bom_lines_shop_bom_idx").on(t.shopId, t.bomId)],
);

export const manufacturingOrders = sqliteTable(
  "manufacturing_orders",
  {
    id: id(),
    shopId: text()
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    docNumber: text(),
    bomId: text()
      .notNull()
      .references(() => boms.id),
    productId: text()
      .notNull()
      .references(() => products.id),
    qty: integer({ mode: "number" }).notNull(), // scale QTY_SCALE
    status: text({ enum: MANUFACTURING_ORDER_STATUSES }).notNull().default("draft"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("manufacturing_orders_shop_status_idx").on(t.shopId, t.status),
    unique("manufacturing_orders_shop_doc_uq").on(t.shopId, t.docNumber),
  ],
);
