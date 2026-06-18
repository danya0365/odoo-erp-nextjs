import { sqliteTable, text, integer, index, unique } from "drizzle-orm/sqlite-core";
import { id, createdAt, updatedAt } from "./_shared";
import { shops } from "./shops";
import { partners } from "./partners";
import { products } from "./products";
import { salesOrders } from "./sales-orders";

export const INVOICE_STATUSES = ["draft", "posted", "paid", "cancelled"] as const;

export const invoices = sqliteTable(
  "invoices",
  {
    id: id(),
    shopId: text()
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    docNumber: text().notNull(),
    salesOrderId: text().references(() => salesOrders.id),
    customerId: text()
      .notNull()
      .references(() => partners.id),
    status: text({ enum: INVOICE_STATUSES }).notNull().default("posted"),
    currency: text().notNull().default("THB"),
    untaxedAmount: integer({ mode: "number" }).notNull().default(0),
    taxAmount: integer({ mode: "number" }).notNull().default(0),
    totalAmount: integer({ mode: "number" }).notNull().default(0),
    amountPaid: integer({ mode: "number" }).notNull().default(0),
    dueDate: text(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("invoices_shop_status_idx").on(t.shopId, t.status),
    unique("invoices_shop_doc_uq").on(t.shopId, t.docNumber),
  ],
);

export const invoiceLines = sqliteTable(
  "invoice_lines",
  {
    id: id(),
    shopId: text()
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    invoiceId: text()
      .notNull()
      .references(() => invoices.id, { onDelete: "cascade" }),
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
  (t) => [index("invoice_lines_shop_invoice_idx").on(t.shopId, t.invoiceId)],
);
