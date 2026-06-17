import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { id, createdAt, updatedAt } from "./_shared";

// tenant root — ทุก business entity scope ด้วย shopId อ้างมาที่นี่
export const shops = sqliteTable(
  "shops",
  {
    id: id(),
    name: text().notNull(),
    slug: text().notNull().unique(),
    isActive: integer({ mode: "boolean" }).notNull().default(true),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("shops_slug_idx").on(t.slug)],
);
