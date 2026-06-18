import { sqliteTable, text, integer, index, unique } from "drizzle-orm/sqlite-core";
import { id, createdAt } from "./_shared";
import { shops } from "./shops";
import { partners } from "./partners";
import { invoices } from "./invoices";

export const PAYMENT_DIRECTIONS = ["inbound", "outbound"] as const;

export const payments = sqliteTable(
  "payments",
  {
    id: id(),
    shopId: text()
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    docNumber: text().notNull(),
    partnerId: text()
      .notNull()
      .references(() => partners.id),
    direction: text({ enum: PAYMENT_DIRECTIONS }).notNull(),
    invoiceId: text().references(() => invoices.id),
    vendorBillId: text(), // FK เพิ่มตอน Phase 4 (purchase)
    amount: integer({ mode: "number" }).notNull(),
    method: text().notNull().default("cash"),
    paidAt: text().notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    index("payments_shop_invoice_idx").on(t.shopId, t.invoiceId),
    unique("payments_shop_doc_uq").on(t.shopId, t.docNumber),
  ],
);
