import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { id, createdAt } from "./_shared";
import { shops } from "./shops";

// รีวิวร้านจากลูกค้าบนหน้า public (ไม่ต้องล็อกอิน)
export const storeReviews = sqliteTable(
  "store_reviews",
  {
    id: id(),
    shopId: text()
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    customerName: text().notNull(),
    rating: integer({ mode: "number" }).notNull(), // 1–5
    comment: text(),
    createdAt: createdAt(),
  },
  (t) => [index("store_reviews_shop_idx").on(t.shopId)],
);
