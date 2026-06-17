// พิสูจน์ test harness + sequence atomic + scope-by-shop (multi-tenant safety net)
import { test } from "node:test";
import assert from "node:assert/strict";

import { withTestDb } from "@/tests/helpers/withTestDb";
import { seedShop } from "@/tests/helpers/seedShop";
import { DrizzleSequenceRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleSequenceRepository";
import { DrizzleUserRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleUserRepository";

test("withTestDb: migrate ตารางครบ + seed shop ได้", async () => {
  const { db, cleanup } = await withTestDb();
  try {
    const a = await seedShop(db, "alpha", "owner@alpha.test");
    assert.ok(a.shopId);
    assert.ok(a.ownerId);
  } finally {
    cleanup();
  }
});

test("sequence.next: เพิ่มทีละ 1, แยกตาม (shop, key)", async () => {
  const { db, cleanup } = await withTestDb();
  try {
    const a = await seedShop(db, "alpha", "owner@alpha.test");
    const b = await seedShop(db, "beta", "owner@beta.test");
    const seq = new DrizzleSequenceRepository(db);

    assert.equal(await seq.next(a.shopId, "sales_order"), 1);
    assert.equal(await seq.next(a.shopId, "sales_order"), 2);
    assert.equal(await seq.next(a.shopId, "sales_order"), 3);
    // คนละ key → ตัวนับแยก
    assert.equal(await seq.next(a.shopId, "invoice"), 1);
    // คนละ shop → ตัวนับแยก
    assert.equal(await seq.next(b.shopId, "sales_order"), 1);
  } finally {
    cleanup();
  }
});

test("scope-by-shop: listByShop ไม่รั่วข้าม tenant", async () => {
  const { db, cleanup } = await withTestDb();
  try {
    const a = await seedShop(db, "alpha", "owner@alpha.test");
    const b = await seedShop(db, "beta", "owner@beta.test");
    const users = new DrizzleUserRepository(db);

    const aUsers = await users.listByShop(a.shopId);
    const bUsers = await users.listByShop(b.shopId);
    assert.equal(aUsers.length, 1);
    assert.equal(bUsers.length, 1);
    assert.equal(aUsers[0].email, "owner@alpha.test");
    assert.equal(bUsers[0].email, "owner@beta.test");
    // ยืนยันไม่มี user ของ b โผล่ใน a
    assert.ok(!aUsers.some((u) => u.shopId === b.shopId));
  } finally {
    cleanup();
  }
});
