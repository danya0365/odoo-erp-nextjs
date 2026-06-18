// integration: DrizzlePartnerRepository CRUD + scope-by-shop + pagination/search/filter
import { test } from "node:test";
import assert from "node:assert/strict";

import { withTestDb } from "@/tests/helpers/withTestDb";
import { seedShop } from "@/tests/helpers/seedShop";
import { DrizzlePartnerRepository } from "@/src/infrastructure/repositories/drizzle/DrizzlePartnerRepository";

test("create + findById (scope by shop)", async () => {
  const { db, cleanup } = await withTestDb();
  try {
    const a = await seedShop(db, "alpha", "o@alpha.test");
    const repo = new DrizzlePartnerRepository(db);
    const created = await repo.create({ shopId: a.shopId, name: "ลูกค้า A", type: "customer" });

    assert.equal((await repo.findById(a.shopId, created.id))?.name, "ลูกค้า A");
    // shop อื่นเข้าไม่ถึง
    assert.equal(await repo.findById("other-shop", created.id), null);
  } finally {
    cleanup();
  }
});

test("list: scope-by-shop ไม่รั่ว + total ถูก", async () => {
  const { db, cleanup } = await withTestDb();
  try {
    const a = await seedShop(db, "alpha", "o@alpha.test");
    const b = await seedShop(db, "beta", "o@beta.test");
    const repo = new DrizzlePartnerRepository(db);
    await repo.create({ shopId: a.shopId, name: "A1", type: "customer" });
    await repo.create({ shopId: a.shopId, name: "A2", type: "vendor" });
    await repo.create({ shopId: b.shopId, name: "B1", type: "customer" });

    const aList = await repo.list(a.shopId, { page: 1, pageSize: 20 });
    assert.equal(aList.total, 2);
    assert.ok(aList.items.every((p) => p.shopId === a.shopId));

    const bList = await repo.list(b.shopId, { page: 1, pageSize: 20 });
    assert.equal(bList.total, 1);
  } finally {
    cleanup();
  }
});

test("list: search + type filter (customer = customer|both)", async () => {
  const { db, cleanup } = await withTestDb();
  try {
    const a = await seedShop(db, "alpha", "o@alpha.test");
    const repo = new DrizzlePartnerRepository(db);
    await repo.create({ shopId: a.shopId, name: "Acme", type: "customer" });
    await repo.create({ shopId: a.shopId, name: "Beta Supplier", type: "vendor" });
    await repo.create({ shopId: a.shopId, name: "Combo", type: "both" });

    const search = await repo.list(a.shopId, { page: 1, pageSize: 20, search: "Acme" });
    assert.equal(search.total, 1);
    assert.equal(search.items[0].name, "Acme");

    const customers = await repo.list(a.shopId, { page: 1, pageSize: 20, status: "customer" });
    // Acme (customer) + Combo (both)
    assert.equal(customers.total, 2);
    const vendors = await repo.list(a.shopId, { page: 1, pageSize: 20, status: "vendor" });
    // Beta (vendor) + Combo (both)
    assert.equal(vendors.total, 2);
  } finally {
    cleanup();
  }
});

test("list: pagination แบ่งหน้า", async () => {
  const { db, cleanup } = await withTestDb();
  try {
    const a = await seedShop(db, "alpha", "o@alpha.test");
    const repo = new DrizzlePartnerRepository(db);
    for (let i = 0; i < 5; i++) {
      await repo.create({ shopId: a.shopId, name: `P${i}`, type: "customer" });
    }
    const p1 = await repo.list(a.shopId, { page: 1, pageSize: 2 });
    assert.equal(p1.total, 5);
    assert.equal(p1.items.length, 2);
    const p3 = await repo.list(a.shopId, { page: 3, pageSize: 2 });
    assert.equal(p3.items.length, 1);
  } finally {
    cleanup();
  }
});

test("update + setActive (scope)", async () => {
  const { db, cleanup } = await withTestDb();
  try {
    const a = await seedShop(db, "alpha", "o@alpha.test");
    const repo = new DrizzlePartnerRepository(db);
    const p = await repo.create({ shopId: a.shopId, name: "เดิม", type: "customer" });

    const updated = await repo.update(a.shopId, p.id, { name: "ใหม่", phone: "0812345678" });
    assert.equal(updated.name, "ใหม่");
    assert.equal(updated.phone, "0812345678");

    const archived = await repo.setActive(a.shopId, p.id, false);
    assert.equal(archived.isActive, false);
  } finally {
    cleanup();
  }
});
