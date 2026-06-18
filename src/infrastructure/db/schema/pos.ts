import { sqliteTable, text, integer, index, unique } from "drizzle-orm/sqlite-core";
import { id, createdAt } from "./_shared";
import { shops } from "./shops";
import { users } from "./users";
import { products } from "./products";

export const POS_SESSION_STATUSES = ["open", "closed"] as const;
export const POS_PAYMENT_METHODS = ["cash", "transfer"] as const;

export const posSessions = sqliteTable(
  "pos_sessions",
  {
    id: id(),
    shopId: text()
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    userId: text()
      .notNull()
      .references(() => users.id),
    status: text({ enum: POS_SESSION_STATUSES }).notNull().default("open"),
    openingCash: integer({ mode: "number" }).notNull().default(0),
    closingCash: integer({ mode: "number" }),
    expectedCash: integer({ mode: "number" }),
    difference: integer({ mode: "number" }),
    openedAt: text().notNull(),
    closedAt: text(),
  },
  (t) => [index("pos_sessions_shop_status_idx").on(t.shopId, t.status)],
);

export const posOrders = sqliteTable(
  "pos_orders",
  {
    id: id(),
    shopId: text()
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    sessionId: text()
      .notNull()
      .references(() => posSessions.id, { onDelete: "cascade" }),
    docNumber: text().notNull(),
    untaxedAmount: integer({ mode: "number" }).notNull().default(0),
    taxAmount: integer({ mode: "number" }).notNull().default(0),
    totalAmount: integer({ mode: "number" }).notNull().default(0),
    paymentMethod: text({ enum: POS_PAYMENT_METHODS }).notNull().default("cash"),
    createdAt: createdAt(),
  },
  (t) => [
    index("pos_orders_shop_session_idx").on(t.shopId, t.sessionId),
    unique("pos_orders_shop_doc_uq").on(t.shopId, t.docNumber),
  ],
);

export const posOrderLines = sqliteTable(
  "pos_order_lines",
  {
    id: id(),
    shopId: text()
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    posOrderId: text()
      .notNull()
      .references(() => posOrders.id, { onDelete: "cascade" }),
    productId: text()
      .notNull()
      .references(() => products.id),
    description: text().notNull().default(""),
    qty: integer({ mode: "number" }).notNull(),
    unitPrice: integer({ mode: "number" }).notNull(),
    taxRateBp: integer({ mode: "number" }).notNull().default(0),
    lineSubtotal: integer({ mode: "number" }).notNull(),
    lineTax: integer({ mode: "number" }).notNull(),
    lineTotal: integer({ mode: "number" }).notNull(),
  },
  (t) => [index("pos_order_lines_shop_order_idx").on(t.shopId, t.posOrderId)],
);
