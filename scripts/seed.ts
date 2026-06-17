// Seed ข้อมูลทดสอบ (idempotent ด้วย onConflictDoNothing): platform_admin + demo shop + owner + staff
import { loadEnvConfig } from "@next/env";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

import * as schema from "../src/infrastructure/db/schema";

async function main() {
  loadEnvConfig(process.cwd());

  const url = process.env.TURSO_DATABASE_URL ?? "file:./local.db";
  const authToken = process.env.TURSO_AUTH_TOKEN || undefined;
  const client = createClient({ url, authToken });
  const db = drizzle(client, { schema, casing: "snake_case" });

  const hash = (plain: string) => bcrypt.hash(plain, 10);

  // 1) platform admin (ไม่มี shop)
  await db
    .insert(schema.users)
    .values({
      email: "admin@odoo-erp.local",
      passwordHash: await hash("admin1234"),
      name: "Platform Admin",
      role: "platform_admin",
      shopId: null,
    })
    .onConflictDoNothing();

  // 2) demo shop (tenant)
  await db
    .insert(schema.shops)
    .values({ name: "ร้านสาธิต", slug: "demo" })
    .onConflictDoNothing();
  const shop = await db.query.shops.findFirst({
    where: eq(schema.shops.slug, "demo"),
  });
  if (!shop) throw new Error("seed: demo shop not found after insert");

  // 3) owner + staff ของ demo shop
  await db
    .insert(schema.users)
    .values([
      {
        shopId: shop.id,
        email: "owner@demo.local",
        passwordHash: await hash("owner1234"),
        name: "เจ้าของร้านสาธิต",
        role: "shop_owner",
      },
      {
        shopId: shop.id,
        email: "staff@demo.local",
        passwordHash: await hash("staff1234"),
        name: "พนักงานสาธิต",
        role: "staff",
      },
    ])
    .onConflictDoNothing();

  console.log("✓ seed เสร็จ");
  console.log("  platform_admin : admin@odoo-erp.local / admin1234");
  console.log("  shop_owner     : owner@demo.local / owner1234");
  console.log("  staff          : staff@demo.local / staff1234");
  client.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
