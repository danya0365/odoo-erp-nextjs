import "server-only";
import { createClient, type Client } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "./schema";

// cache ข้าม HMR ใน dev เพื่อไม่เปิด connection ใหม่ทุกครั้งที่แก้โค้ด
const globalForDb = globalThis as unknown as {
  __dbClient?: Client;
  __db?: LibSQLDatabase<typeof schema>;
};

function buildClient(): Client {
  const url = process.env.TURSO_DATABASE_URL ?? "file:./local.db";
  const authToken = process.env.TURSO_AUTH_TOKEN || undefined;
  return createClient({ url, authToken });
}

const client = globalForDb.__dbClient ?? buildClient();
if (process.env.NODE_ENV !== "production") globalForDb.__dbClient = client;

export const db =
  globalForDb.__db ?? drizzle(client, { schema, casing: "snake_case" });
if (process.env.NODE_ENV !== "production") globalForDb.__db = db;

export { schema };
export type Database = typeof db;
