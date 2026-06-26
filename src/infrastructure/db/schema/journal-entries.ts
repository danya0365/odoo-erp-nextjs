import { sqliteTable, text, integer, index, unique } from "drizzle-orm/sqlite-core";
import { id, createdAt, updatedAt } from "./_shared";
import { shops } from "./shops";
import { partners } from "./partners";
import { accounts } from "./accounts";
import { journals } from "./journals";

export const JOURNAL_ENTRY_SOURCE_TYPES = ["invoice", "bill", "payment", "manual", "pos", "payroll", "credit_note", "refund"] as const;
export const JOURNAL_ENTRY_STATUSES = ["draft", "posted"] as const;

export const journalEntries = sqliteTable(
  "journal_entries",
  {
    id: id(),
    shopId: text()
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    docNumber: text().notNull(),
    journalId: text()
      .notNull()
      .references(() => journals.id),
    date: text().notNull(), // ISO-8601
    ref: text(), // เลขเอกสารต้นทาง เช่น INV00001
    sourceType: text({ enum: JOURNAL_ENTRY_SOURCE_TYPES }).notNull(),
    sourceId: text(),
    status: text({ enum: JOURNAL_ENTRY_STATUSES }).notNull().default("posted"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    unique("journal_entries_shop_doc_uq").on(t.shopId, t.docNumber),
    index("journal_entries_shop_date_idx").on(t.shopId, t.date),
    index("journal_entries_shop_source_idx").on(t.shopId, t.sourceType, t.sourceId),
  ],
);

export const journalEntryLines = sqliteTable(
  "journal_entry_lines",
  {
    id: id(),
    shopId: text()
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    entryId: text()
      .notNull()
      .references(() => journalEntries.id, { onDelete: "cascade" }),
    accountId: text()
      .notNull()
      .references(() => accounts.id),
    partnerId: text().references(() => partners.id),
    label: text().notNull().default(""),
    debit: integer({ mode: "number" }).notNull().default(0),
    credit: integer({ mode: "number" }).notNull().default(0),
  },
  (t) => [
    index("journal_entry_lines_shop_entry_idx").on(t.shopId, t.entryId),
    index("journal_entry_lines_shop_account_idx").on(t.shopId, t.accountId),
  ],
);
