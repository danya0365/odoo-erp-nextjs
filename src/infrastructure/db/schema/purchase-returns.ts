import { sqliteTable, text, integer, index, unique } from "drizzle-orm/sqlite-core";
import { id, createdAt, updatedAt } from "./_shared";
import { shops } from "./shops";
import { partners } from "./partners";
import { products } from "./products";
import { vendorBills } from "./vendor-bills";
import { purchaseOrders } from "./purchase-orders";

export const PURCHASE_RETURN_STATUSES = ["draft", "credited", "cancelled"] as const;

// ใบคืนของผู้ขาย / ใบลดหนี้ผู้ขาย (vendor credit note)
export const purchaseReturns = sqliteTable(
  "purchase_returns",
  {
    id: id(),
    shopId: text()
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    docNumber: text().notNull(),
    vendorBillId: text().references(() => vendorBills.id),
    purchaseOrderId: text().references(() => purchaseOrders.id),
    vendorId: text()
      .notNull()
      .references(() => partners.id),
    status: text({ enum: PURCHASE_RETURN_STATUSES }).notNull().default("draft"),
    currency: text().notNull().default("THB"),
    untaxedAmount: integer({ mode: "number" }).notNull().default(0),
    taxAmount: integer({ mode: "number" }).notNull().default(0),
    totalAmount: integer({ mode: "number" }).notNull().default(0),
    reason: text(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("purchase_returns_shop_status_idx").on(t.shopId, t.status),
    unique("purchase_returns_shop_doc_uq").on(t.shopId, t.docNumber),
  ],
);

export const purchaseReturnLines = sqliteTable(
  "purchase_return_lines",
  {
    id: id(),
    shopId: text()
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    purchaseReturnId: text()
      .notNull()
      .references(() => purchaseReturns.id, { onDelete: "cascade" }),
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
  (t) => [index("purchase_return_lines_shop_return_idx").on(t.shopId, t.purchaseReturnId)],
);
