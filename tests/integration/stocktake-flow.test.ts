// integration: ตรวจนับสต๊อก ผ่าน repo จริง — เปิดรอบ (snapshot on-hand) → นับ → ปรับตามส่วนต่าง
import { test } from "node:test";
import assert from "node:assert/strict";

import { withTestDb } from "@/tests/helpers/withTestDb";
import { seedShop } from "@/tests/helpers/seedShop";
import { DrizzleStockCountRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleStockCountRepository";
import { DrizzleProductRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleProductRepository";
import { DrizzleStockMoveRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleStockMoveRepository";
import { DrizzleStockLocationRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleStockLocationRepository";
import { DrizzleSequenceRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleSequenceRepository";
import { AdjustStockUseCase } from "@/src/application/use-cases/inventory/AdjustStockUseCase";
import { CreateStockCountUseCase } from "@/src/application/use-cases/inventory/CreateStockCountUseCase";
import { ApplyStockCountUseCase } from "@/src/application/use-cases/inventory/ApplyStockCountUseCase";

function repos(db: Awaited<ReturnType<typeof withTestDb>>["db"]) {
  return {
    counts: new DrizzleStockCountRepository(db),
    products: new DrizzleProductRepository(db),
    moves: new DrizzleStockMoveRepository(db),
    locations: new DrizzleStockLocationRepository(db),
    seq: new DrizzleSequenceRepository(db),
  };
}

test("เปิดรอบนับ → ปรับตามส่วนต่าง → on-hand ตรงกับยอดนับจริง", async () => {
  const { db, cleanup } = await withTestDb();
  try {
    const shop = await seedShop(db, "alpha", "o@alpha.test");
    const r = repos(db);
    const p1 = await r.products.create({ shopId: shop.shopId, sku: "P1", name: "สินค้า1", type: "stockable", salePrice: 100, costPrice: 0, taxRateBp: 0, uom: "ชิ้น" });
    const p2 = await r.products.create({ shopId: shop.shopId, sku: "P2", name: "สินค้า2", type: "stockable", salePrice: 100, costPrice: 0, taxRateBp: 0, uom: "ชิ้น" });
    await new AdjustStockUseCase(r.products, r.moves, r.locations).execute({ shopId: shop.shopId, productId: p1.id, qtyDelta: 10000 });
    await new AdjustStockUseCase(r.products, r.moves, r.locations).execute({ shopId: shop.shopId, productId: p2.id, qtyDelta: 5000 });

    // เปิดรอบ → snapshot systemQty
    const sc = await new CreateStockCountUseCase(r.counts, r.products, r.moves, r.seq).execute(shop.shopId, "นับประจำปี");
    assert.equal(sc.docNumber, "SC00001");
    const withLines = (await r.counts.findById(shop.shopId, sc.id))!;
    assert.equal(withLines.lines.length, 2);
    const l1 = withLines.lines.find((l) => l.productId === p1.id)!;
    assert.equal(l1.systemQty, 10000);

    // นับจริง: p1 ขาดเหลือ 8, p2 เกินเป็น 6
    const l2 = withLines.lines.find((l) => l.productId === p2.id)!;
    await new ApplyStockCountUseCase(r.counts, r.moves, r.locations).execute(shop.shopId, sc.id, [
      { lineId: l1.id, countedQty: 8000 },
      { lineId: l2.id, countedQty: 6000 },
    ]);

    assert.equal(await r.moves.onHandByProduct(shop.shopId, p1.id), 8000);
    assert.equal(await r.moves.onHandByProduct(shop.shopId, p2.id), 6000);
    assert.equal((await r.counts.findById(shop.shopId, sc.id))!.status, "applied");
  } finally {
    cleanup();
  }
});

test("scope-by-shop: รอบนับของ A ไม่โผล่ใน B", async () => {
  const { db, cleanup } = await withTestDb();
  try {
    const a = await seedShop(db, "alpha", "o@alpha.test");
    const b = await seedShop(db, "beta", "o@beta.test");
    const r = repos(db);
    await r.products.create({ shopId: a.shopId, sku: "P1", name: "ส", type: "stockable", salePrice: 1, costPrice: 0, taxRateBp: 0, uom: "ชิ้น" });
    await new CreateStockCountUseCase(r.counts, r.products, r.moves, r.seq).execute(a.shopId, null);
    assert.equal((await r.counts.list(a.shopId, { page: 1, pageSize: 20, status: "" })).total, 1);
    assert.equal((await r.counts.list(b.shopId, { page: 1, pageSize: 20, status: "" })).total, 0);
  } finally {
    cleanup();
  }
});
