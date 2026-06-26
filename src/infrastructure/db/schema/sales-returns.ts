import { sqliteTable, text, integer, index, unique } from "drizzle-orm/sqlite-core";
import { id, createdAt, updatedAt } from "./_shared";
import { shops } from "./shops";
import { partners } from "./partners";
import { products } from "./products";
import { invoices } from "./invoices";
import { salesOrders } from "./sales-orders";

export const SALES_RETURN_STATUSES = ["draft", "credited", "refunded", "cancelled"] as const;

// ใบคืนสินค้า/ใบลดหนี้ (credit note) — กลับด้านของใบแจ้งหนี้
export const salesReturns = sqliteTable(
  "sales_returns",
  {
    id: id(),
    shopId: text()
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    docNumber: text().notNull(),
    invoiceId: text().references(() => invoices.id),
    salesOrderId: text().references(() => salesOrders.id),
    customerId: text()
      .notNull()
      .references(() => partners.id),
    status: text({ enum: SALES_RETURN_STATUSES }).notNull().default("draft"),
    currency: text().notNull().default("THB"),
    untaxedAmount: integer({ mode: "number" }).notNull().default(0),
    taxAmount: integer({ mode: "number" }).notNull().default(0),
    totalAmount: integer({ mode: "number" }).notNull().default(0),
    refundedAmount: integer({ mode: "number" }).notNull().default(0),
    reason: text(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("sales_returns_shop_status_idx").on(t.shopId, t.status),
    index("sales_returns_shop_invoice_idx").on(t.shopId, t.invoiceId),
    unique("sales_returns_shop_doc_uq").on(t.shopId, t.docNumber),
  ],
);

export const salesReturnLines = sqliteTable(
  "sales_return_lines",
  {
    id: id(),
    shopId: text()
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    salesReturnId: text()
      .notNull()
      .references(() => salesReturns.id, { onDelete: "cascade" }),
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
  (t) => [index("sales_return_lines_shop_return_idx").on(t.shopId, t.salesReturnId)],
);
