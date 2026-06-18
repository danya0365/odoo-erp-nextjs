// integration: การผลิตผ่าน repo จริง — BOM → MO → confirm → produce (ตัดวัตถุดิบ + รับสินค้า) + scope
import { test } from "node:test";
import assert from "node:assert/strict";

import { withTestDb } from "@/tests/helpers/withTestDb";
import { seedShop } from "@/tests/helpers/seedShop";
import { DrizzleBomRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleBomRepository";
import { DrizzleManufacturingOrderRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleManufacturingOrderRepository";
import { DrizzleProductRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleProductRepository";
import { DrizzleStockMoveRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleStockMoveRepository";
import { DrizzleStockLocationRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleStockLocationRepository";
import { DrizzleSequenceRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleSequenceRepository";
import { CreateBomUseCase } from "@/src/application/use-cases/manufacturing/CreateBomUseCase";
import { CreateManufacturingOrderUseCase } from "@/src/application/use-cases/manufacturing/CreateManufacturingOrderUseCase";
import { ConfirmManufacturingOrderUseCase } from "@/src/application/use-cases/manufacturing/ConfirmManufacturingOrderUseCase";
import { ProduceManufacturingOrderUseCase } from "@/src/application/use-cases/manufacturing/ProduceManufacturingOrderUseCase";

function repos(db: Awaited<ReturnType<typeof withTestDb>>["db"]) {
  return {
    boms: new DrizzleBomRepository(db),
    orders: new DrizzleManufacturingOrderRepository(db),
    products: new DrizzleProductRepository(db),
    moves: new DrizzleStockMoveRepository(db),
    locations: new DrizzleStockLocationRepository(db),
    sequences: new DrizzleSequenceRepository(db),
  };
}

async function seedProductsAndStock(db: Awaited<ReturnType<typeof withTestDb>>["db"], shopId: string) {
  const r = repos(db);
  const fg = await r.products.create({ shopId, sku: "FG", name: "สินค้าสำเร็จรูป", type: "stockable", salePrice: 30000, costPrice: 0, taxRateBp: 0, uom: "ชิ้น" });
  const c1 = await r.products.create({ shopId, sku: "C1", name: "วัตถุดิบ1", type: "stockable", salePrice: 0, costPrice: 5000, taxRateBp: 0, uom: "ชิ้น" });
  const c2 = await r.products.create({ shopId, sku: "C2", name: "วัตถุดิบ2", type: "stockable", salePrice: 0, costPrice: 3000, taxRateBp: 0, uom: "ชิ้น" });
  const loc = await r.locations.ensureDefault(shopId);
  await r.moves.appendMany([
    { shopId, productId: c1.id, locationId: loc.id, qtyDelta: 100000, type: "in", sourceType: "adjustment" },
    { shopId, productId: c2.id, locationId: loc.id, qtyDelta: 100000, type: "in", sourceType: "adjustment" },
  ]);
  return { fg, c1, c2 };
}

test("ผลิต: ตัดวัตถุดิบ (×จำนวน) + รับสินค้าสำเร็จรูป + MO sequence", async () => {
  const { db, cleanup } = await withTestDb();
  try {
    const shop = await seedShop(db, "alpha", "o@alpha.test");
    const r = repos(db);
    const { fg, c1, c2 } = await seedProductsAndStock(db, shop.shopId);

    const bom = await new CreateBomUseCase(r.boms, r.products).execute({
      shopId: shop.shopId, productId: fg.id, name: "สูตร",
      lines: [
        { componentId: c1.id, qtyPerUnit: 2000 }, // 2 ต่อชิ้น
        { componentId: c2.id, qtyPerUnit: 1000 }, // 1 ต่อชิ้น
      ],
    });
    const order = await new CreateManufacturingOrderUseCase(r.boms, r.orders).execute(shop.shopId, bom.id, 5000); // ผลิต 5
    const confirmed = await new ConfirmManufacturingOrderUseCase(r.orders, r.sequences).execute(shop.shopId, order.id);
    assert.equal(confirmed.docNumber, "MO00001");

    const done = await new ProduceManufacturingOrderUseCase(r.orders, r.boms, r.moves, r.locations).execute(shop.shopId, order.id);
    assert.equal(done.status, "done");

    // c1: 100 - 10 = 90, c2: 100 - 5 = 95, fg: 0 + 5 = 5
    assert.equal(await r.moves.onHandByProduct(shop.shopId, c1.id), 90000);
    assert.equal(await r.moves.onHandByProduct(shop.shopId, c2.id), 95000);
    assert.equal(await r.moves.onHandByProduct(shop.shopId, fg.id), 5000);
  } finally {
    cleanup();
  }
});

test("ผลิตเกินวัตถุดิบ → error (ไม่เปลี่ยนสต๊อก/สถานะ)", async () => {
  const { db, cleanup } = await withTestDb();
  try {
    const shop = await seedShop(db, "alpha", "o@alpha.test");
    const r = repos(db);
    const fg = await r.products.create({ shopId: shop.shopId, sku: "FG", name: "FG", type: "stockable", salePrice: 0, costPrice: 0, taxRateBp: 0, uom: "ชิ้น" });
    const c1 = await r.products.create({ shopId: shop.shopId, sku: "C1", name: "C1", type: "stockable", salePrice: 0, costPrice: 0, taxRateBp: 0, uom: "ชิ้น" });
    const loc = await r.locations.ensureDefault(shop.shopId);
    await r.moves.appendMany([{ shopId: shop.shopId, productId: c1.id, locationId: loc.id, qtyDelta: 3000, type: "in", sourceType: "adjustment" }]);

    const bom = await new CreateBomUseCase(r.boms, r.products).execute({
      shopId: shop.shopId, productId: fg.id, name: "สูตร", lines: [{ componentId: c1.id, qtyPerUnit: 2000 }],
    });
    const order = await new CreateManufacturingOrderUseCase(r.boms, r.orders).execute(shop.shopId, bom.id, 5000); // ต้องใช้ 10 มี 3
    await new ConfirmManufacturingOrderUseCase(r.orders, r.sequences).execute(shop.shopId, order.id);

    await assert.rejects(
      () => new ProduceManufacturingOrderUseCase(r.orders, r.boms, r.moves, r.locations).execute(shop.shopId, order.id),
      /วัตถุดิบไม่พอ/,
    );
    assert.equal(await r.moves.onHandByProduct(shop.shopId, c1.id), 3000); // ไม่เปลี่ยน
    assert.equal((await r.orders.findById(shop.shopId, order.id))!.status, "confirmed"); // ยังไม่ done
  } finally {
    cleanup();
  }
});

test("scope-by-shop: สูตร/ใบสั่งผลิต ของ B ไม่ปนกับ A", async () => {
  const { db, cleanup } = await withTestDb();
  try {
    const a = await seedShop(db, "alpha", "o@alpha.test");
    const b = await seedShop(db, "beta", "o@beta.test");
    const r = repos(db);
    const { fg, c1 } = await seedProductsAndStock(db, a.shopId);
    const bom = await new CreateBomUseCase(r.boms, r.products).execute({
      shopId: a.shopId, productId: fg.id, name: "สูตร A",
      lines: [{ componentId: c1.id, qtyPerUnit: 1000 }],
    });
    await new CreateManufacturingOrderUseCase(r.boms, r.orders).execute(a.shopId, bom.id, 1000);

    assert.equal((await r.boms.list(a.shopId)).length, 1);
    assert.equal((await r.boms.list(b.shopId)).length, 0);
    assert.equal((await r.orders.list(a.shopId, { page: 1, pageSize: 20 })).total, 1);
    assert.equal((await r.orders.list(b.shopId, { page: 1, pageSize: 20 })).total, 0);
  } finally {
    cleanup();
  }
});
