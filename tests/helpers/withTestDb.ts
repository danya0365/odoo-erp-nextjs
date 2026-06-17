// สร้าง libSQL ไฟล์ชั่วคราว + รัน migration (ตรรกะเดียวกับ scripts/migrate.ts)
// คืน { db, cleanup } — ใช้ใน integration test (ฉีดเข้า constructor ของ Drizzle*Repository)
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";

import * as schema from "@/src/infrastructure/db/schema";

export interface TestDb {
  db: ReturnType<typeof drizzle<typeof schema>>;
  cleanup: () => void;
}

export async function withTestDb(): Promise<TestDb> {
  const dir = mkdtempSync(join(tmpdir(), "erp-test-"));
  const file = join(dir, "test.db");
  const client = createClient({ url: `file:${file}` });
  const db = drizzle(client, { schema, casing: "snake_case" });
  await migrate(db, { migrationsFolder: "./drizzle" });
  return {
    db,
    cleanup: () => {
      client.close();
      rmSync(dir, { recursive: true, force: true });
    },
  };
}
