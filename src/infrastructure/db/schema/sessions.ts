import { sqliteTable, text, index } from "drizzle-orm/sqlite-core";
import { id, createdAt } from "./_shared";
import { users } from "./users";

// session token = id (nanoid) เก็บใน cookie httpOnly
export const sessions = sqliteTable(
  "sessions",
  {
    id: id(),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: text().notNull(), // ISO-8601
    createdAt: createdAt(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);
