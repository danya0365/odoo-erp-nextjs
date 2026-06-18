// integration: full sales cycle ผ่าน repo จริง — transactional create, sequence monotonic,
// stock OUT จริง (on-hand ลด), over-delivery กัน, payment → done
import { test } from "node:test";
import assert from "node:assert/strict";

import { withTestDb } from "@/tests/helpers/withTestDb";
import { seedShop } from "@/tests/helpers/seedShop";
import { DrizzleSalesOrderRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleSalesOrderRepository";
import { DrizzleInvoiceRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleInvoiceRepository";
import { DrizzlePaymentRepository } from "@/src/infrastructure/repositories/drizzle/DrizzlePaymentRepository";
import { DrizzleSequenceRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleSequenceRepository";
import { DrizzleProductRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleProductRepository";
import { DrizzlePartnerRepository } from "@/src/infrastructure/repositories/drizzle/DrizzlePartnerRepository";
import { DrizzleStockMoveRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleStockMoveRepository";
import { DrizzleStockLocationRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleStockLocationRepository";
import { CreateQuotationUseCase } from "@/src/application/use-cases/sales/CreateQuotationUseCase";
import { ConfirmSalesOrderUseCase } from "@/src/application/use-cases/sales/ConfirmSalesOrderUseCase";
import { DeliverSalesOrderUseCase } from "@/src/application/use-cases/sales/DeliverSalesOrderUseCase";
import { InvoiceSalesOrderUseCase } from "@/src/application/use-cases/sales/InvoiceSalesOrderUseCase";
import { RegisterInvoicePaymentUseCase } from "@/src/application/use-cases/sales/RegisterInvoicePaymentUseCase";
import { AdjustStockUseCase } from "@/src/application/use-cases/inventory/AdjustStockUseCase";

const NOW = "2026-01-01T00:00:00.000Z";

async function setup(db: Parameters<typeof seedRepos>[0]) {
  return seedRepos(db);
}
function seedRepos(db: Awaited<ReturnType<typeof withTestDb>>["db"]) {
  return {
    sales: new DrizzleSalesOrderRepository(db),
    invoices: new DrizzleInvoiceRepository(db),
    payments: new DrizzlePaymentRepository(db),
    seq: new DrizzleSequenceRepository(db),
    products: new DrizzleProductRepository(db),
    partners: new DrizzlePartnerRepository(db),
    moves: new DrizzleStockMoveRepository(db),
    locations: new DrizzleStockLocationRepository(db),
  };
}

test("full sales cycle: quotation → confirm → deliver(stock OUT) → invoice → pay → done", async () => {
  const { db, cleanup } = await withTestDb();
  try {
    const shop = await seedShop(db, "alpha", "o@alpha.test");
    const r = await setup(db);
    const customer = await r.partners.create({ shopId: shop.shopId, name: "ลูกค้า", type: "customer" });
    const product = await r.products.create({
      shopId: shop.shopId, sku: "P1", name: "สินค้า", type: "stockable",
      salePrice: 100, costPrice: 80, taxRateBp: 700, uom: "ชิ้น",
    });
    // เติมสต๊อก 100
    await new AdjustStockUseCase(r.products, r.moves, r.locations).execute({
      shopId: shop.shopId, productId: product.id, qtyDelta: 100000,
    });

    // quotation qty 10
    const so = await new CreateQuotationUseCase(r.sales).execute({
      shopId: shop.shopId, customerId: customer.id, orderDate: NOW,
      lines: [{ productId: product.id, description: product.name, qtyOrdered: 10000, unitPrice: 100, taxRateBp: 700 }],
    });
    assert.equal(so.totalAmount, 1070); // 1000 + 7%

    // confirm → SO00001
    const confirmed = await new ConfirmSalesOrderUseCase(r.sales, r.seq).execute(shop.shopId, so.id, NOW);
    assert.equal(confirmed.docNumber, "SO00001");

    // deliver ครบ → stock OUT, on-hand 100 → 90
    const withLines = (await r.sales.findById(shop.shopId, so.id))!;
    const delivered = await new DeliverSalesOrderUseCase(r.sales, r.moves, r.locations).execute(
      shop.shopId, so.id, [{ lineId: withLines.lines[0].id, qty: 10000 }],
    );
    assert.equal(delivered.status, "delivered");
    assert.equal(await r.moves.onHandByProduct(shop.shopId, product.id), 90000);

    // invoice → INV00001
    const invoice = await new InvoiceSalesOrderUseCase(r.sales, r.invoices, r.seq).execute(shop.shopId, so.id);
    assert.equal(invoice.docNumber, "INV00001");
    assert.equal((await r.sales.findById(shop.shopId, so.id))!.status, "invoiced");

    // pay เต็ม → PAY00001, invoice paid, SO done
    await new RegisterInvoicePaymentUseCase(r.invoices, r.payments, r.sales, r.seq).execute(
      shop.shopId, invoice.id, 1070, "cash", NOW,
    );
    assert.equal((await r.invoices.findById(shop.shopId, invoice.id))!.status, "paid");
    assert.equal((await r.sales.findById(shop.shopId, so.id))!.status, "done");
  } finally {
    cleanup();
  }
});

test("sequence SO monotonic ต่อ shop + over-delivery กัน", async () => {
  const { db, cleanup } = await withTestDb();
  try {
    const shop = await seedShop(db, "alpha", "o@alpha.test");
    const r = await setup(db);
    const customer = await r.partners.create({ shopId: shop.shopId, name: "ลูกค้า", type: "customer" });
    const product = await r.products.create({
      shopId: shop.shopId, sku: "P1", name: "สินค้า", type: "stockable",
      salePrice: 100, costPrice: 80, taxRateBp: 0, uom: "ชิ้น",
    });
    const mkSo = () =>
      new CreateQuotationUseCase(r.sales).execute({
        shopId: shop.shopId, customerId: customer.id, orderDate: NOW,
        lines: [{ productId: product.id, description: product.name, qtyOrdered: 5000, unitPrice: 100, taxRateBp: 0 }],
      });

    const so1 = await mkSo();
    const so2 = await mkSo();
    const c1 = await new ConfirmSalesOrderUseCase(r.sales, r.seq).execute(shop.shopId, so1.id, NOW);
    const c2 = await new ConfirmSalesOrderUseCase(r.sales, r.seq).execute(shop.shopId, so2.id, NOW);
    assert.equal(c1.docNumber, "SO00001");
    assert.equal(c2.docNumber, "SO00002");

    const line = (await r.sales.findById(shop.shopId, so1.id))!.lines[0];
    await assert.rejects(
      () => new DeliverSalesOrderUseCase(r.sales, r.moves, r.locations).execute(
        shop.shopId, so1.id, [{ lineId: line.id, qty: 6000 }], // เกิน 5
      ),
      /เกินจำนวน/,
    );
  } finally {
    cleanup();
  }
});
