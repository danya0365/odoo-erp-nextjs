// integration: POS ผ่าน repo จริง — เปิดกะ → ขายสด (ตัดสต๊อก + ลงบัญชี) → ปิดกะกระทบเงินสด
import { test } from "node:test";
import assert from "node:assert/strict";

import { withTestDb } from "@/tests/helpers/withTestDb";
import { seedShop } from "@/tests/helpers/seedShop";
import { DrizzlePosSessionRepository } from "@/src/infrastructure/repositories/drizzle/DrizzlePosSessionRepository";
import { DrizzlePosOrderRepository } from "@/src/infrastructure/repositories/drizzle/DrizzlePosOrderRepository";
import { DrizzleStockMoveRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleStockMoveRepository";
import { DrizzleStockLocationRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleStockLocationRepository";
import { DrizzleSequenceRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleSequenceRepository";
import { DrizzleProductRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleProductRepository";
import { DrizzleAccountRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleAccountRepository";
import { DrizzleJournalRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleJournalRepository";
import { DrizzleJournalEntryRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleJournalEntryRepository";
import { OpenPosSessionUseCase } from "@/src/application/use-cases/pos/OpenPosSessionUseCase";
import { CheckoutPosOrderUseCase } from "@/src/application/use-cases/pos/CheckoutPosOrderUseCase";
import { ClosePosSessionUseCase } from "@/src/application/use-cases/pos/ClosePosSessionUseCase";

const NOW = "2026-01-01T00:00:00.000Z";

function repos(db: Awaited<ReturnType<typeof withTestDb>>["db"]) {
  return {
    sessions: new DrizzlePosSessionRepository(db),
    orders: new DrizzlePosOrderRepository(db),
    moves: new DrizzleStockMoveRepository(db),
    locations: new DrizzleStockLocationRepository(db),
    sequences: new DrizzleSequenceRepository(db),
    products: new DrizzleProductRepository(db),
    postDeps: {
      accounts: new DrizzleAccountRepository(db),
      journals: new DrizzleJournalRepository(db),
      entries: new DrizzleJournalEntryRepository(db),
      sequences: new DrizzleSequenceRepository(db),
    },
  };
}

test("เปิดกะ → ขายสด → ตัดสต๊อก + ลงบัญชี → ปิดกะ (เงินสดตรง)", async () => {
  const { db, cleanup } = await withTestDb();
  try {
    const shop = await seedShop(db, "alpha", "o@alpha.test");
    const r = repos(db);
    const loc = await r.locations.ensureDefault(shop.shopId);
    const product = await r.products.create({
      shopId: shop.shopId, sku: "P1", name: "สินค้า", type: "stockable",
      salePrice: 10000, costPrice: 5000, taxRateBp: 700, uom: "ชิ้น",
    });
    await r.moves.appendMany([
      { shopId: shop.shopId, productId: product.id, locationId: loc.id, qtyDelta: 20000, type: "in", sourceType: "adjustment" },
    ]);

    const session = await new OpenPosSessionUseCase(r.sessions).execute(shop.shopId, shop.ownerId, 100000, NOW);

    const order = await new CheckoutPosOrderUseCase(
      r.sessions, r.orders, r.moves, r.locations, r.sequences, r.postDeps,
    ).execute({
      shopId: shop.shopId, sessionId: session.id, paymentMethod: "cash", now: NOW,
      lines: [{ productId: product.id, description: product.name, qty: 2000, unitPrice: 10000, taxRateBp: 700, isStockable: true }],
    });
    assert.equal(order.docNumber, "POS00001");
    assert.equal(order.totalAmount, 21400); // 200 + 7%

    // สต๊อกลด 20 → 18
    assert.equal(await r.moves.onHandByProduct(shop.shopId, product.id), 18000);

    // ลงบัญชีขายสด: trial balance สมดุล + เงินสด debit
    const tb = await r.postDeps.entries.trialBalance(shop.shopId);
    const tDebit = tb.reduce((s, x) => s + x.debit, 0);
    const tCredit = tb.reduce((s, x) => s + x.credit, 0);
    assert.equal(tDebit, tCredit);
    assert.equal(tDebit, 21400);

    // ปิดกะ: นับจริง = 1000 + 214 = 1214.00 → ตรง (difference 0)
    const closed = await new ClosePosSessionUseCase(r.sessions, r.orders).execute(
      shop.shopId, session.id, 121400, NOW,
    );
    assert.equal(closed.expectedCash, 121400);
    assert.equal(closed.difference, 0);
    assert.equal(closed.status, "closed");
  } finally {
    cleanup();
  }
});

test("เปิดกะซ้ำไม่ได้ + scope-by-shop (B ไม่เห็นกะของ A)", async () => {
  const { db, cleanup } = await withTestDb();
  try {
    const a = await seedShop(db, "alpha", "o@alpha.test");
    const b = await seedShop(db, "beta", "o@beta.test");
    const r = repos(db);
    await new OpenPosSessionUseCase(r.sessions).execute(a.shopId, a.ownerId, 0, NOW);
    await assert.rejects(
      () => new OpenPosSessionUseCase(r.sessions).execute(a.shopId, a.ownerId, 0, NOW),
      /เปิดอยู่แล้ว/,
    );
    assert.equal(await r.sessions.findOpen(b.shopId), null); // B ไม่เห็นของ A
    assert.equal((await r.sessions.list(b.shopId)).length, 0);
  } finally {
    cleanup();
  }
});
