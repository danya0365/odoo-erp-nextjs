import { sqliteTable, text, integer, index, unique } from "drizzle-orm/sqlite-core";
import { id, createdAt } from "./_shared";
import { shops } from "./shops";

// รายการเดินบัญชีธนาคาร (นำเข้าเพื่อกระทบยอด)
export const bankStatementLines = sqliteTable(
  "bank_statement_lines",
  {
    id: id(),
    shopId: text()
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    statementDate: text().notNull(),
    description: text().notNull().default(""),
    amount: integer({ mode: "number" }).notNull(), // signed
    reconciled: integer({ mode: "boolean" }).notNull().default(false),
    createdAt: createdAt(),
  },
  (t) => [index("bank_statement_lines_shop_recon_idx").on(t.shopId, t.reconciled)],
);

// บันทึกการปิดงวดบัญชี
export const periodCloses = sqliteTable(
  "period_closes",
  {
    id: id(),
    shopId: text()
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    period: text().notNull(), // "YYYY-MM"
    note: text(),
    closedAt: text().notNull(),
    createdAt: createdAt(),
  },
  (t) => [unique("period_closes_shop_period_uq").on(t.shopId, t.period)],
);
