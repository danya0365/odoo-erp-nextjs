// integration: รายงานรวม ผ่าน repo จริง — sales summary/by-month/top products + valuation + scope-by-shop
import { test } from "node:test";
import assert from "node:assert/strict";

import { withTestDb } from "@/tests/helpers/withTestDb";
import { seedShop } from "@/tests/helpers/seedShop";
import { DrizzleReportingRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleReportingRepository";
import { DrizzleInvoiceRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleInvoiceRepository";
import { DrizzleProductRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleProductRepository";
import { DrizzleStockMoveRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleStockMoveRepository";
import { DrizzleStockLocationRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleStockLocationRepository";
import { DrizzlePartnerRepository } from "@/src/infrastructure/repositories/drizzle/DrizzlePartnerRepository";
import { GetInventoryValuationUseCase } from "@/src/application/use-cases/reporting/GetInventoryValuationUseCase";

function repos(db: Awaited<ReturnType<typeof withTestDb>>["db"]) {
  return {
    reporting: new DrizzleReportingRepository(db),
    invoices: new DrizzleInvoiceRepository(db),
    products: new DrizzleProductRepository(db),
    moves: new DrizzleStockMoveRepository(db),
    locations: new DrizzleStockLocationRepository(db),
    partners: new DrizzlePartnerRepository(db),
  };
}

async function setupSale(db: Awaited<ReturnType<typeof withTestDb>>["db"], shopId: string) {
  const r = repos(db);
  const cust = await r.partners.create({ shopId, name: "ลูกค้า", type: "customer" });
  const product = await r.products.create({
    shopId, sku: "P1", name: "วัตถุดิบ", type: "stockable",
    salePrice: 10000, costPrice: 5000, taxRateBp: 0, uom: "ชิ้น",
  });
  const loc = await r.locations.ensureDefault(shopId);
  await r.moves.appendMany([
    { shopId, productId: product.id, locationId: loc.id, qtyDelta: 20000, type: "in", sourceType: "adjustment", sourceId: null },
  ]);
  const inv = await r.invoices.createWithLines({
    shopId, docNumber: "INV00001", salesOrderId: null, customerId: cust.id,
    status: "posted", currency: "THB", untaxedAmount: 100000, taxAmount: 0, totalAmount: 100000,
    lines: [{
      productId: product.id, description: product.name, qty: 10000, unitPrice: 10000, taxRateBp: 0,
      lineSubtotal: 100000, lineTax: 0, lineTotal: 100000,
    }],
  });
  await r.invoices.update(shopId, inv.id, { amountPaid: 50000 });
  return { product };
}

test("salesSummary / salesByMonth / topProducts จากใบแจ้งหนี้จริง", async () => {
  const { db, cleanup } = await withTestDb();
  try {
    const shop = await seedShop(db, "alpha", "o@alpha.test");
    const { product } = await setupSale(db, shop.shopId);
    const r = repos(db);

    const summary = await r.reporting.salesSummary(shop.shopId);
    assert.equal(summary.count, 1);
    assert.equal(summary.total, 100000);
    assert.equal(summary.paid, 50000);

    const byMonth = await r.reporting.salesByMonth(shop.shopId);
    assert.equal(byMonth.length, 1);
    assert.equal(byMonth[0].total, 100000);

    const top = await r.reporting.topProducts(shop.shopId, 5);
    assert.equal(top.length, 1);
    assert.equal(top[0].productId, product.id);
    assert.equal(top[0].qty, 10000);
    assert.equal(top[0].amount, 100000);
  } finally {
    cleanup();
  }
});

test("inventoryValuation = on-hand × ต้นทุน (ผ่าน use case)", async () => {
  const { db, cleanup } = await withTestDb();
  try {
    const shop = await seedShop(db, "alpha", "o@alpha.test");
    await setupSale(db, shop.shopId);
    const r = repos(db);
    const res = await new GetInventoryValuationUseCase(r.reporting).execute(shop.shopId);
    assert.equal(res.items.length, 1);
    assert.equal(res.items[0].onHand, 20000); // 20 หน่วย
    assert.equal(res.items[0].value, 100000); // 20 × 50.00 = 1000.00
    assert.equal(res.totalValue, 100000);
    assert.equal(res.outOfStock, 0);
  } finally {
    cleanup();
  }
});

test("scope-by-shop: รายงานของ B ว่างเมื่อข้อมูลอยู่ที่ A", async () => {
  const { db, cleanup } = await withTestDb();
  try {
    const a = await seedShop(db, "alpha", "o@alpha.test");
    const b = await seedShop(db, "beta", "o@beta.test");
    await setupSale(db, a.shopId);
    const r = repos(db);

    const sumB = await r.reporting.salesSummary(b.shopId);
    assert.equal(sumB.count, 0);
    assert.equal(sumB.total, 0);
    assert.equal((await r.reporting.topProducts(b.shopId, 5)).length, 0);
    assert.equal((await r.reporting.inventoryValuation(b.shopId)).length, 0);
    // A ยังมีข้อมูล
    assert.equal((await r.reporting.salesSummary(a.shopId)).total, 100000);
  } finally {
    cleanup();
  }
});
