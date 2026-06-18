import { sqliteTable, text, integer, index, unique } from "drizzle-orm/sqlite-core";
import { id, createdAt } from "./_shared";
import { shops } from "./shops";
import { salesOrders } from "./sales-orders";

// บันทึกออร์เดอร์จากหน้าร้านออนไลน์ — ผูกกับใบขายที่สร้างเข้า pipeline
export const onlineOrders = sqliteTable(
  "online_orders",
  {
    id: id(),
    shopId: text()
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    orderNumber: text().notNull(),
    customerName: text().notNull(),
    email: text().notNull(),
    phone: text(),
    salesOrderId: text()
      .notNull()
      .references(() => salesOrders.id),
    totalAmount: integer({ mode: "number" }).notNull().default(0),
    createdAt: createdAt(),
  },
  (t) => [
    index("online_orders_shop_idx").on(t.shopId),
    unique("online_orders_shop_number_uq").on(t.shopId, t.orderNumber),
  ],
);
