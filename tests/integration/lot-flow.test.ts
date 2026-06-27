// integration: ล็อต/วันหมดอายุ — รับเข้า 2 ล็อต → ตัด FEFO (หมดอายุก่อนออกก่อน)
import { test } from "node:test";
import assert from "node:assert/strict";

import { withTestDb } from "@/tests/helpers/withTestDb";
import { seedShop } from "@/tests/helpers/seedShop";
import { DrizzleProductLotRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleProductLotRepository";
import { DrizzleProductRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleProductRepository";
import { ReceiveLotUseCase, AllocateFefoUseCase } from "@/src/application/use-cases/inventory/LotUseCases";

test("รับ 2 ล็อต → ตัด FEFO ตัดล็อตหมดอายุก่อน + กันของไม่พอ", async () => {
  const { db, cleanup } = await withTestDb();
  try {
    const shop = await seedShop(db, "alpha", "o@alpha.test");
    const lots = new DrizzleProductLotRepository(db);
    const products = new DrizzleProductRepository(db);
    const p = await products.create({ shopId: shop.shopId, sku: "MILK", name: "นม", type: "stockable", salePrice: 100, costPrice: 0, taxRateBp: 0, uom: "กล่อง" });

    const receive = new ReceiveLotUseCase(lots, products);
    const later = await receive.execute(shop.shopId, p.id, "LOT-LATE", "2026-09-01", 5000); // หมดอายุทีหลัง
    const early = await receive.execute(shop.shopId, p.id, "LOT-EARLY", "2026-03-01", 3000); // หมดอายุก่อน

    // ตัด 4 → 3 จาก EARLY (หมดก่อน) + 1 จาก LATE
    const alloc = await new AllocateFefoUseCase(lots).execute(shop.shopId, p.id, 4000);
    assert.equal(alloc[0].lotId, early.id);
    assert.equal(alloc[0].qty, 3000);
    assert.equal(alloc[1].lotId, later.id);
    assert.equal(alloc[1].qty, 1000);

    // ยอดคงเหลือ: EARLY=0 (หลุดจาก listByProduct), LATE=4
    const remaining = await lots.listByProduct(shop.shopId, p.id);
    assert.equal(remaining.length, 1);
    assert.equal(remaining[0].id, later.id);
    assert.equal(remaining[0].qty, 4000);

    // ตัดเกินที่เหลือ → error
    await assert.rejects(() => new AllocateFefoUseCase(lots).execute(shop.shopId, p.id, 9999), /ไม่พอ/);
  } finally {
    cleanup();
  }
});
