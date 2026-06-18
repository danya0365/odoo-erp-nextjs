import { sqliteTable, text, integer, index, unique } from "drizzle-orm/sqlite-core";
import { id, createdAt, updatedAt } from "./_shared";
import { shops } from "./shops";
import { partners } from "./partners";
import { products } from "./products";

export const SALES_ORDER_STATUSES = [
  "draft",
  "confirmed",
  "partially_delivered",
  "delivered",
  "invoiced",
  "done",
  "cancelled",
] as const;

export const salesOrders = sqliteTable(
  "sales_orders",
  {
    id: id(),
    shopId: text()
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    docNumber: text(), // ออกตอน confirm
    customerId: text()
      .notNull()
      .references(() => partners.id),
    status: text({ enum: SALES_ORDER_STATUSES }).notNull().default("draft"),
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
    index("sales_orders_shop_status_idx").on(t.shopId, t.status),
    index("sales_orders_shop_created_idx").on(t.shopId, t.createdAt),
    unique("sales_orders_shop_doc_uq").on(t.shopId, t.docNumber),
  ],
);

export const salesOrderLines = sqliteTable(
  "sales_order_lines",
  {
    id: id(),
    shopId: text()
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    salesOrderId: text()
      .notNull()
      .references(() => salesOrders.id, { onDelete: "cascade" }),
    productId: text()
      .notNull()
      .references(() => products.id),
    description: text().notNull().default(""),
    qtyOrdered: integer({ mode: "number" }).notNull(),
    qtyDelivered: integer({ mode: "number" }).notNull().default(0),
    qtyInvoiced: integer({ mode: "number" }).notNull().default(0),
    unitPrice: integer({ mode: "number" }).notNull(),
    taxRateBp: integer({ mode: "number" }).notNull().default(0),
    lineSubtotal: integer({ mode: "number" }).notNull(),
    lineTax: integer({ mode: "number" }).notNull(),
    lineTotal: integer({ mode: "number" }).notNull(),
  },
  (t) => [index("sales_order_lines_shop_order_idx").on(t.shopId, t.salesOrderId)],
);
