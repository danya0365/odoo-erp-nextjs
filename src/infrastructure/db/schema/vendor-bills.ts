import { sqliteTable, text, integer, index, unique } from "drizzle-orm/sqlite-core";
import { id, createdAt, updatedAt } from "./_shared";
import { shops } from "./shops";
import { partners } from "./partners";
import { products } from "./products";
import { purchaseOrders } from "./purchase-orders";

export const VENDOR_BILL_STATUSES = ["draft", "posted", "paid", "cancelled"] as const;

export const vendorBills = sqliteTable(
  "vendor_bills",
  {
    id: id(),
    shopId: text()
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    docNumber: text().notNull(),
    purchaseOrderId: text().references(() => purchaseOrders.id),
    vendorId: text()
      .notNull()
      .references(() => partners.id),
    status: text({ enum: VENDOR_BILL_STATUSES }).notNull().default("posted"),
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
    index("vendor_bills_shop_status_idx").on(t.shopId, t.status),
    unique("vendor_bills_shop_doc_uq").on(t.shopId, t.docNumber),
  ],
);

export const vendorBillLines = sqliteTable(
  "vendor_bill_lines",
  {
    id: id(),
    shopId: text()
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    vendorBillId: text()
      .notNull()
      .references(() => vendorBills.id, { onDelete: "cascade" }),
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
  (t) => [index("vendor_bill_lines_shop_bill_idx").on(t.shopId, t.vendorBillId)],
);
