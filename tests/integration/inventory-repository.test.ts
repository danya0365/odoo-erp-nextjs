// integration: product repo + stock ledger (on-hand=SUM) + scope-by-shop + AdjustStock use case
import { test } from "node:test";
import assert from "node:assert/strict";

import { withTestDb } from "@/tests/helpers/withTestDb";
import { seedShop } from "@/tests/helpers/seedShop";
import { DrizzleProductRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleProductRepository";
import { DrizzleStockMoveRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleStockMoveRepository";
import { DrizzleStockLocationRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleStockLocationRepository";
import { AdjustStockUseCase } from "@/src/application/use-cases/inventory/AdjustStockUseCase";

function productInput(shopId: string, sku: string) {
  return {
    shopId,
    sku,
    name: `สินค้า ${sku}`,
    type: "stockable" as const,
    salePrice: 10000,
    costPrice: 8000,
    taxRateBp: 700,
    uom: "ชิ้น",
  };
}

test("product: create + findBySku + scope-by-shop", async () => {
  const { db, cleanup } = await withTestDb();
  try {
    const a = await seedShop(db, "alpha", "o@alpha.test");
    const b = await seedShop(db, "beta", "o@beta.test");
    const repo = new DrizzleProductRepository(db);
    const p = await repo.create(productInput(a.shopId, "P1"));

    assert.equal((await repo.findBySku(a.shopId, "P1"))?.id, p.id);
    assert.equal(await repo.findById(b.shopId, p.id), null); // shop อื่นเข้าไม่ถึง
    assert.equal(await repo.findBySku(b.shopId, "P1"), null);
  } finally {
    cleanup();
  }
});

test("stock ledger: on-hand = SUM(qtyDelta) + scope", async () => {
  const { db, cleanup } = await withTestDb();
  try {
    const a = await seedShop(db, "alpha", "o@alpha.test");
    const products = new DrizzleProductRepository(db);
    const locations = new DrizzleStockLocationRepository(db);
    const moves = new DrizzleStockMoveRepository(db);

    const p = await products.create(productInput(a.shopId, "P1"));
    const loc = await locations.ensureDefault(a.shopId);

    await moves.appendMany([
      { shopId: a.shopId, productId: p.id, locationId: loc.id, qtyDelta: 5000, type: "in", sourceType: "adjustment" },
      { shopId: a.shopId, productId: p.id, locationId: loc.id, qtyDelta: 3000, type: "in", sourceType: "receipt" },
      { shopId: a.shopId, productId: p.id, locationId: loc.id, qtyDelta: -2000, type: "out", sourceType: "delivery" },
    ]);

    assert.equal(await moves.onHandByProduct(a.shopId, p.id), 6000);
    const list = await moves.onHandList(a.shopId);
    assert.deepEqual(list, [{ productId: p.id, onHand: 6000 }]);
    // shop อื่นเห็น 0
    assert.equal(await moves.onHandByProduct("other", p.id), 0);
  } finally {
    cleanup();
  }
});

test("ensureDefault: idempotent (สร้างครั้งเดียว)", async () => {
  const { db, cleanup } = await withTestDb();
  try {
    const a = await seedShop(db, "alpha", "o@alpha.test");
    const locations = new DrizzleStockLocationRepository(db);
    const l1 = await locations.ensureDefault(a.shopId);
    const l2 = await locations.ensureDefault(a.shopId);
    assert.equal(l1.id, l2.id);
  } finally {
    cleanup();
  }
});

test("AdjustStockUseCase ผ่าน repo จริง: เพิ่ม/ลด + กันติดลบ + ledger เพิ่มจริง", async () => {
  const { db, cleanup } = await withTestDb();
  try {
    const a = await seedShop(db, "alpha", "o@alpha.test");
    const products = new DrizzleProductRepository(db);
    const moves = new DrizzleStockMoveRepository(db);
    const locations = new DrizzleStockLocationRepository(db);
    const p = await products.create(productInput(a.shopId, "P1"));

    const uc = new AdjustStockUseCase(products, moves, locations);
    assert.equal(await uc.execute({ shopId: a.shopId, productId: p.id, qtyDelta: 10000 }), 10000);
    assert.equal(await uc.execute({ shopId: a.shopId, productId: p.id, qtyDelta: -4000 }), 6000);
    await assert.rejects(
      () => uc.execute({ shopId: a.shopId, productId: p.id, qtyDelta: -7000 }),
      /ติดลบ/,
    );
    assert.equal((await moves.listByProduct(a.shopId, p.id)).length, 2);
  } finally {
    cleanup();
  }
});
