import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { id, createdAt, updatedAt } from "./_shared";
import { shops } from "./shops";

// ผู้ติดต่อ: ลูกค้า/ผู้ขาย/ทั้งคู่ — master data ที่ Sales/Purchase อ้างถึง
export const PARTNER_TYPES = ["customer", "vendor", "both"] as const;

export const partners = sqliteTable(
  "partners",
  {
    id: id(),
    shopId: text()
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    name: text().notNull(),
    type: text({ enum: PARTNER_TYPES }).notNull().default("customer"),
    email: text(),
    phone: text(),
    taxId: text(),
    street: text(),
    city: text(),
    country: text(),
    isCompany: integer({ mode: "boolean" }).notNull().default(false),
    // self-FK: contact ภายใต้บริษัท (nullable)
    parentId: text(),
    isActive: integer({ mode: "boolean" }).notNull().default(true),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("partners_shop_type_idx").on(t.shopId, t.type),
    index("partners_shop_name_idx").on(t.shopId, t.name),
    index("partners_shop_created_idx").on(t.shopId, t.createdAt),
  ],
);
