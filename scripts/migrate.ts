// Programmatic migrator — apply เฉพาะ migration ที่ยังไม่ถูกลง (ตาม drizzle/_journal), idempotent
// ใช้ทั้ง dev (`npm run db:migrate`) และ prod (ผ่าน scripts/vercel-migrate.mjs)
import { loadEnvConfig } from "@next/env";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";

async function main() {
  loadEnvConfig(process.cwd());

  const url = process.env.TURSO_DATABASE_URL ?? "file:./local.db";
  const authToken = process.env.TURSO_AUTH_TOKEN || undefined;

  const client = createClient({ url, authToken });
  const db = drizzle(client);

  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log(`✓ migrations applied (${url})`);
  client.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
