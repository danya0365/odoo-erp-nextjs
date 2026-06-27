import { sqliteTable, text, integer, index, unique } from "drizzle-orm/sqlite-core";
import { id, createdAt, updatedAt } from "./_shared";
import { shops } from "./shops";
import { partners } from "./partners";

export const DISCOUNT_TYPES = ["percent", "fixed"] as const;

export const promotions = sqliteTable(
  "promotions",
  {
    id: id(),
    shopId: text()
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    code: text().notNull(),
    description: text().notNull().default(""),
    discountType: text({ enum: DISCOUNT_TYPES }).notNull().default("percent"),
    value: integer({ mode: "number" }).notNull().default(0),
    minSpend: integer({ mode: "number" }).notNull().default(0),
    isActive: integer({ mode: "boolean" }).notNull().default(true),
    createdAt: createdAt(),
  },
  (t) => [unique("promotions_shop_code_uq").on(t.shopId, t.code)],
);

export const loyaltyAccounts = sqliteTable(
  "loyalty_accounts",
  {
    id: id(),
    shopId: text()
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    customerId: text()
      .notNull()
      .references(() => partners.id),
    points: integer({ mode: "number" }).notNull().default(0),
    updatedAt: updatedAt(),
  },
  (t) => [
    unique("loyalty_accounts_shop_customer_uq").on(t.shopId, t.customerId),
    index("loyalty_accounts_shop_idx").on(t.shopId),
  ],
);
