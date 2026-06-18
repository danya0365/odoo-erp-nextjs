// integration: หลายคลัง + โอนย้าย (move คู่ atomic) + จุดสั่งซื้อซ้ำ + scope-by-shop
import { test } from "node:test";
import assert from "node:assert/strict";

import { withTestDb } from "@/tests/helpers/withTestDb";
import { seedShop } from "@/tests/helpers/seedShop";
import { DrizzleStockLocationRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleStockLocationRepository";
import { DrizzleStockMoveRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleStockMoveRepository";
import { DrizzleReorderRuleRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleReorderRuleRepository";
import { DrizzleProductRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleProductRepository";
import { CreateLocationUseCase } from "@/src/application/use-cases/inventory/CreateLocationUseCase";
import { TransferStockUseCase } from "@/src/application/use-cases/inventory/TransferStockUseCase";
import { SetReorderRuleUseCase } from "@/src/application/use-cases/inventory/SetReorderRuleUseCase";
import { GetReplenishmentUseCase } from "@/src/application/use-cases/inventory/GetReplenishmentUseCase";

function repos(db: Awaited<ReturnType<typeof withTestDb>>["db"]) {
  return {
    locations: new DrizzleStockLocationRepository(db),
    moves: new DrizzleStockMoveRepository(db),
    rules: new DrizzleReorderRuleRepository(db),
    products: new DrizzleProductRepository(db),
  };
}

test("โอนย้าย: on-hand แยกคลังเปลี่ยน, รวมคงที่, ขา transfer 2 รายการ", async () => {
  const { db, cleanup } = await withTestDb();
  try {
    const shop = await seedShop(db, "alpha", "o@alpha.test");
    const r = repos(db);
    const main = await r.locations.ensureDefault(shop.shopId);
    const branch = await new CreateLocationUseCase(r.locations).execute(shop.shopId, "คลัง B");
    const product = await r.products.create({
      shopId: shop.shopId, sku: "P1", name: "สินค้า", type: "stockable",
      salePrice: 0, costPrice: 5000, taxRateBp: 0, uom: "ชิ้น",
    });
    await r.moves.appendMany([
      { shopId: shop.shopId, productId: product.id, locationId: main.id, qtyDelta: 10000, type: "in", sourceType: "adjustment" },
    ]);

    await new TransferStockUseCase(r.locations, r.moves).execute({
      shopId: shop.shopId, productId: product.id, fromLocationId: main.id, toLocationId: branch.id, qty: 4000,
    });

    assert.equal(await r.moves.onHandByProductAndLocation(shop.shopId, product.id, main.id), 6000);
    assert.equal(await r.moves.onHandByProductAndLocation(shop.shopId, product.id, branch.id), 4000);
    assert.equal(await r.moves.onHandByProduct(shop.shopId, product.id), 10000); // รวมคงที่

    const transferMoves = await r.moves.listBySourceType(shop.shopId, "transfer", 10);
    assert.equal(transferMoves.length, 2); // out + in

    // โอนเกินยอดต้นทาง (เหลือ 6000) → reject
    await assert.rejects(
      () => new TransferStockUseCase(r.locations, r.moves).execute({
        shopId: shop.shopId, productId: product.id, fromLocationId: main.id, toLocationId: branch.id, qty: 7000,
      }),
      /เกินยอดคงเหลือ/,
    );
  } finally {
    cleanup();
  }
});

test("จุดสั่งซื้อซ้ำ: on-hand ≤ min → suggestion = max − onHand", async () => {
  const { db, cleanup } = await withTestDb();
  try {
    const shop = await seedShop(db, "alpha", "o@alpha.test");
    const r = repos(db);
    const main = await r.locations.ensureDefault(shop.shopId);
    const product = await r.products.create({
      shopId: shop.shopId, sku: "P1", name: "สินค้า", type: "stockable",
      salePrice: 0, costPrice: 0, taxRateBp: 0, uom: "ชิ้น",
    });
    await r.moves.appendMany([
      { shopId: shop.shopId, productId: product.id, locationId: main.id, qtyDelta: 10000, type: "in", sourceType: "adjustment" },
    ]);
    await new SetReorderRuleUseCase(r.rules, r.products).execute(shop.shopId, product.id, 15000, 20000);

    const res = await new GetReplenishmentUseCase(r.rules, r.moves, r.products).execute(shop.shopId);
    const row = res.rows.find((x) => x.productId === product.id)!;
    assert.equal(row.onHand, 10000);
    assert.equal(row.suggestion, 10000); // 20000 - 10000 (10000 ≤ 15000)
    assert.equal(res.toReorder, 1);
  } finally {
    cleanup();
  }
});

test("scope-by-shop: คลัง/กฎ ของ B ไม่ปนกับ A", async () => {
  const { db, cleanup } = await withTestDb();
  try {
    const a = await seedShop(db, "alpha", "o@alpha.test");
    const b = await seedShop(db, "beta", "o@beta.test");
    const r = repos(db);
    await r.locations.ensureDefault(a.shopId);
    await new CreateLocationUseCase(r.locations).execute(a.shopId, "คลัง A2");
    await r.locations.ensureDefault(b.shopId);

    const locsA = await r.locations.list(a.shopId);
    const locsB = await r.locations.list(b.shopId);
    assert.equal(locsA.length, 2);
    assert.equal(locsB.length, 1); // เห็นแค่ของตัวเอง
    assert.equal(locsB.some((l) => locsA.find((x) => x.id === l.id)), false);

    const prod = await r.products.create({
      shopId: a.shopId, sku: "P1", name: "x", type: "stockable",
      salePrice: 0, costPrice: 0, taxRateBp: 0, uom: "ชิ้น",
    });
    await new SetReorderRuleUseCase(r.rules, r.products).execute(a.shopId, prod.id, 1000, 5000);
    assert.equal((await r.rules.list(a.shopId)).length, 1);
    assert.equal((await r.rules.list(b.shopId)).length, 0);
  } finally {
    cleanup();
  }
});
