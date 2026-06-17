import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { id, createdAt, updatedAt } from "./_shared";
import { shops } from "./shops";

// role union — เก็บใกล้ schema (ใช้เป็น enum ของคอลัมน์ + อ้างใน domain/types/roles)
export const USER_ROLES = ["platform_admin", "shop_owner", "staff"] as const;

export const users = sqliteTable(
  "users",
  {
    id: id(),
    // FK ไป tenant — null = platform_admin (ข้ามทุก shop)
    shopId: text().references(() => shops.id, { onDelete: "cascade" }),
    email: text().notNull().unique(),
    passwordHash: text().notNull(),
    name: text().notNull(),
    role: text({ enum: USER_ROLES }).notNull(),
    isActive: integer({ mode: "boolean" }).notNull().default(true),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("users_shop_idx").on(t.shopId), index("users_email_idx").on(t.email)],
);
