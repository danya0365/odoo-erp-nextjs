import { sqliteTable, text, integer, index, unique } from "drizzle-orm/sqlite-core";
import { id, createdAt, updatedAt } from "./_shared";
import { shops } from "./shops";
import { partners } from "./partners";
import { products } from "./products";

export const PURCHASE_ORDER_STATUSES = [
  "rfq",
  "confirmed",
  "partially_received",
  "received",
  "billed",
  "done",
  "cancelled",
] as const;

export const purchaseOrders = sqliteTable(
  "purchase_orders",
  {
    id: id(),
    shopId: text()
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    docNumber: text(),
    vendorId: text()
      .notNull()
      .references(() => partners.id),
    status: text({ enum: PURCHASE_ORDER_STATUSES }).notNull().default("rfq"),
    currency: text().notNull().default("THB"),
    untaxedAmount: integer({ mode: "number" }).notNull().default(0),
    taxAmount: integer({ mode: "number" }).notNull().default(0),
    totalAmount: integer({ mode: "number" }).notNull().default(0),
    orderDate: text().notNull(),
    confirmedAt: text(),
    note: text(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("purchase_orders_shop_status_idx").on(t.shopId, t.status),
    index("purchase_orders_shop_created_idx").on(t.shopId, t.createdAt),
    unique("purchase_orders_shop_doc_uq").on(t.shopId, t.docNumber),
  ],
);

export const purchaseOrderLines = sqliteTable(
  "purchase_order_lines",
  {
    id: id(),
    shopId: text()
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    purchaseOrderId: text()
      .notNull()
      .references(() => purchaseOrders.id, { onDelete: "cascade" }),
    productId: text()
      .notNull()
      .references(() => products.id),
    description: text().notNull().default(""),
    qtyOrdered: integer({ mode: "number" }).notNull(),
    qtyReceived: integer({ mode: "number" }).notNull().default(0),
    qtyBilled: integer({ mode: "number" }).notNull().default(0),
    unitPrice: integer({ mode: "number" }).notNull(),
    taxRateBp: integer({ mode: "number" }).notNull().default(0),
    lineSubtotal: integer({ mode: "number" }).notNull(),
    lineTax: integer({ mode: "number" }).notNull(),
    lineTotal: integer({ mode: "number" }).notNull(),
  },
  (t) => [index("purchase_order_lines_shop_order_idx").on(t.shopId, t.purchaseOrderId)],
);
