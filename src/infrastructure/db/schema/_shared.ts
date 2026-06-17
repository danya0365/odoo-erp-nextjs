import { text } from "drizzle-orm/sqlite-core";
import { nanoid } from "nanoid";

/** primary key ที่แอปสร้างเอง (text/nanoid) — join มัลติเทแนนต์ง่าย */
export const id = () =>
  text()
    .primaryKey()
    .$defaultFn(() => nanoid());

/** ISO-8601 string ตั้งค่าตอน insert */
export const createdAt = () =>
  text()
    .notNull()
    .$defaultFn(() => new Date().toISOString());

/** ISO-8601 string ตั้งตอน insert และรีเฟรชตอน update */
export const updatedAt = () =>
  text()
    .notNull()
    .$defaultFn(() => new Date().toISOString())
    .$onUpdateFn(() => new Date().toISOString());
