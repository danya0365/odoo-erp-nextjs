import { loadEnvConfig } from "@next/env";
import { defineConfig } from "drizzle-kit";

// โหลด .env* แบบเดียวกับ Next (drizzle-kit รันนอก runtime ของ Next)
loadEnvConfig(process.cwd());

const url = process.env.TURSO_DATABASE_URL ?? "file:./local.db"; // local = ไฟล์
const authToken = process.env.TURSO_AUTH_TOKEN; // prod = Turso creds

export default defineConfig({
  dialect: "turso",
  schema: "./src/infrastructure/db/schema/index.ts",
  out: "./drizzle",
  dbCredentials: { url, ...(authToken ? { authToken } : {}) },
  casing: "snake_case", // คอลัมน์เป็น snake_case อัตโนมัติจาก field camelCase
});
