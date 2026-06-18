// integration: full purchase cycle ผ่าน repo จริง — stock IN (on-hand เพิ่ม), sequence, over-receive
import { test } from "node:test";
import assert from "node:assert/strict";

import { withTestDb } from "@/tests/helpers/withTestDb";
import { seedShop } from "@/tests/helpers/seedShop";
import { DrizzlePurchaseOrderRepository } from "@/src/infrastructure/repositories/drizzle/DrizzlePurchaseOrderRepository";
import { DrizzleVendorBillRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleVendorBillRepository";
import { DrizzlePaymentRepository } from "@/src/infrastructure/repositories/drizzle/DrizzlePaymentRepository";
import { DrizzleSequenceRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleSequenceRepository";
import { DrizzleProductRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleProductRepository";
import { DrizzlePartnerRepository } from "@/src/infrastructure/repositories/drizzle/DrizzlePartnerRepository";
import { DrizzleStockMoveRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleStockMoveRepository";
import { DrizzleStockLocationRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleStockLocationRepository";
import { CreateRfqUseCase } from "@/src/application/use-cases/purchase/CreateRfqUseCase";
import { ConfirmPurchaseOrderUseCase } from "@/src/application/use-cases/purchase/ConfirmPurchaseOrderUseCase";
import { ReceivePurchaseOrderUseCase } from "@/src/application/use-cases/purchase/ReceivePurchaseOrderUseCase";
import { CreateVendorBillUseCase } from "@/src/application/use-cases/purchase/CreateVendorBillUseCase";
import { RegisterBillPaymentUseCase } from "@/src/application/use-cases/purchase/RegisterBillPaymentUseCase";

const NOW = "2026-01-01T00:00:00.000Z";

function repos(db: Awaited<ReturnType<typeof withTestDb>>["db"]) {
  return {
    po: new DrizzlePurchaseOrderRepository(db),
    bills: new DrizzleVendorBillRepository(db),
    payments: new DrizzlePaymentRepository(db),
    seq: new DrizzleSequenceRepository(db),
    products: new DrizzleProductRepository(db),
    partners: new DrizzlePartnerRepository(db),
    moves: new DrizzleStockMoveRepository(db),
    locations: new DrizzleStockLocationRepository(db),
  };
}

test("full purchase cycle: rfq → confirm → receive(stock IN) → bill → pay → done", async () => {
  const { db, cleanup } = await withTestDb();
  try {
    const shop = await seedShop(db, "alpha", "o@alpha.test");
    const r = repos(db);
    const vendor = await r.partners.create({ shopId: shop.shopId, name: "ผู้ขาย", type: "vendor" });
    const product = await r.products.create({
      shopId: shop.shopId, sku: "P1", name: "วัตถุดิบ", type: "stockable",
      salePrice: 150, costPrice: 100, taxRateBp: 700, uom: "ชิ้น",
    });

    // rfq qty 20
    const rfq = await new CreateRfqUseCase(r.po).execute({
      shopId: shop.shopId, vendorId: vendor.id, orderDate: NOW,
      lines: [{ productId: product.id, description: product.name, qtyOrdered: 20000, unitPrice: 100, taxRateBp: 700 }],
    });
    assert.equal(rfq.totalAmount, 2140); // 2000 + 7%

    const confirmed = await new ConfirmPurchaseOrderUseCase(r.po, r.seq).execute(shop.shopId, rfq.id, NOW);
    assert.equal(confirmed.docNumber, "PO00001");

    // receive ครบ → stock IN, on-hand 0 → 20
    const line = (await r.po.findById(shop.shopId, rfq.id))!.lines[0];
    const received = await new ReceivePurchaseOrderUseCase(r.po, r.moves, r.locations).execute(
      shop.shopId, rfq.id, [{ lineId: line.id, qty: 20000 }],
    );
    assert.equal(received.status, "received");
    assert.equal(await r.moves.onHandByProduct(shop.shopId, product.id), 20000);

    // bill → BILL00001
    const bill = await new CreateVendorBillUseCase(r.po, r.bills, r.seq).execute(shop.shopId, rfq.id);
    assert.equal(bill.docNumber, "BILL00001");
    assert.equal((await r.po.findById(shop.shopId, rfq.id))!.status, "billed");

    // pay เต็ม → bill paid + PO done, payment outbound
    const payment = await new RegisterBillPaymentUseCase(r.bills, r.payments, r.po, r.seq).execute(
      shop.shopId, bill.id, 2140, "cash", NOW,
    );
    assert.equal(payment.direction, "outbound");
    assert.equal((await r.bills.findById(shop.shopId, bill.id))!.status, "paid");
    assert.equal((await r.po.findById(shop.shopId, rfq.id))!.status, "done");
  } finally {
    cleanup();
  }
});

test("over-receive กัน + PO sequence monotonic", async () => {
  const { db, cleanup } = await withTestDb();
  try {
    const shop = await seedShop(db, "alpha", "o@alpha.test");
    const r = repos(db);
    const vendor = await r.partners.create({ shopId: shop.shopId, name: "ผู้ขาย", type: "vendor" });
    const product = await r.products.create({
      shopId: shop.shopId, sku: "P1", name: "วัตถุดิบ", type: "stockable",
      salePrice: 0, costPrice: 100, taxRateBp: 0, uom: "ชิ้น",
    });
    const mk = () =>
      new CreateRfqUseCase(r.po).execute({
        shopId: shop.shopId, vendorId: vendor.id, orderDate: NOW,
        lines: [{ productId: product.id, description: product.name, qtyOrdered: 5000, unitPrice: 100, taxRateBp: 0 }],
      });
    const o1 = await mk();
    const o2 = await mk();
    const c1 = await new ConfirmPurchaseOrderUseCase(r.po, r.seq).execute(shop.shopId, o1.id, NOW);
    const c2 = await new ConfirmPurchaseOrderUseCase(r.po, r.seq).execute(shop.shopId, o2.id, NOW);
    assert.equal(c1.docNumber, "PO00001");
    assert.equal(c2.docNumber, "PO00002");

    const line = (await r.po.findById(shop.shopId, o1.id))!.lines[0];
    await assert.rejects(
      () => new ReceivePurchaseOrderUseCase(r.po, r.moves, r.locations).execute(
        shop.shopId, o1.id, [{ lineId: line.id, qty: 6000 }],
      ),
      /เกินจำนวน/,
    );
  } finally {
    cleanup();
  }
});
