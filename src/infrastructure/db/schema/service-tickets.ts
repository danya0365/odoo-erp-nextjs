import { sqliteTable, text, index, unique } from "drizzle-orm/sqlite-core";
import { id, createdAt, updatedAt } from "./_shared";
import { shops } from "./shops";
import { partners } from "./partners";
import { employees } from "./hr";

export const SERVICE_TICKET_STATUSES = ["open", "assigned", "done", "cancelled"] as const;

export const serviceTickets = sqliteTable(
  "service_tickets",
  {
    id: id(),
    shopId: text()
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    docNumber: text().notNull(),
    customerId: text()
      .notNull()
      .references(() => partners.id),
    subject: text().notNull().default(""),
    description: text().notNull().default(""),
    status: text({ enum: SERVICE_TICKET_STATUSES }).notNull().default("open"),
    assigneeId: text().references(() => employees.id),
    scheduledAt: text(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("service_tickets_shop_status_idx").on(t.shopId, t.status),
    unique("service_tickets_shop_doc_uq").on(t.shopId, t.docNumber),
  ],
);
