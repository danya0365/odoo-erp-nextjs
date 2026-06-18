import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { id, createdAt, updatedAt } from "./_shared";
import { shops } from "./shops";
import { partners } from "./partners";
import { salesOrders } from "./sales-orders";

export const OPPORTUNITY_STATUSES = ["active", "won", "lost"] as const;

export const crmStages = sqliteTable(
  "crm_stages",
  {
    id: id(),
    shopId: text()
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    name: text().notNull(),
    sequence: integer({ mode: "number" }).notNull().default(0),
    isWon: integer({ mode: "boolean" }).notNull().default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("crm_stages_shop_seq_idx").on(t.shopId, t.sequence)],
);

export const opportunities = sqliteTable(
  "opportunities",
  {
    id: id(),
    shopId: text()
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    name: text().notNull(),
    partnerId: text().references(() => partners.id),
    contactName: text(),
    email: text(),
    phone: text(),
    expectedRevenue: integer({ mode: "number" }).notNull().default(0),
    probability: integer({ mode: "number" }).notNull().default(0),
    stageId: text()
      .notNull()
      .references(() => crmStages.id),
    status: text({ enum: OPPORTUNITY_STATUSES }).notNull().default("active"),
    lostReason: text(),
    salesOrderId: text().references(() => salesOrders.id),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("opportunities_shop_status_idx").on(t.shopId, t.status),
    index("opportunities_shop_stage_idx").on(t.shopId, t.stageId),
  ],
);
