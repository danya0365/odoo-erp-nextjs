import { sqliteTable, text, integer, unique } from "drizzle-orm/sqlite-core";
import { id, createdAt } from "./_shared";
import { shops } from "./shops";

// บันทึกการยื่น ภพ.30 ต่องวด (snapshot ภาษีขาย/ซื้อ ณ เวลายื่น)
export const vatFilings = sqliteTable(
  "vat_filings",
  {
    id: id(),
    shopId: text()
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    periodStart: text().notNull(), // "YYYY-MM"
    periodEnd: text().notNull(),
    outputVat: integer({ mode: "number" }).notNull().default(0),
    inputVat: integer({ mode: "number" }).notNull().default(0),
    netPayable: integer({ mode: "number" }).notNull().default(0),
    filedAt: text().notNull(),
    createdAt: createdAt(),
  },
  (t) => [unique("vat_filings_shop_period_uq").on(t.shopId, t.periodStart)],
);
