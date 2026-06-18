import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { id, createdAt, updatedAt } from "./_shared";
import { shops } from "./shops";

// MVP: คลังเริ่มต้นหนึ่งที่ต่อ shop (รองรับหลายคลังได้ภายหลังแบบ expand-only)
export const stockLocations = sqliteTable(
  "stock_locations",
  {
    id: id(),
    shopId: text()
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    name: text().notNull(),
    isDefault: integer({ mode: "boolean" }).notNull().default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("stock_locations_shop_idx").on(t.shopId)],
);
