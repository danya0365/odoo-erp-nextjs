// integration: หน้าร้านออนไลน์ผ่าน repo จริง — สั่งซื้อ → สร้างใบขาย + ลูกค้า + online order; scope
import { test } from "node:test";
import assert from "node:assert/strict";

import { withTestDb } from "@/tests/helpers/withTestDb";
import { seedShop } from "@/tests/helpers/seedShop";
import { DrizzleShopRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleShopRepository";
import { DrizzleProductRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleProductRepository";
import { DrizzlePartnerRepository } from "@/src/infrastructure/repositories/drizzle/DrizzlePartnerRepository";
import { DrizzleSalesOrderRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleSalesOrderRepository";
import { DrizzleOnlineOrderRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleOnlineOrderRepository";
import { DrizzleSequenceRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleSequenceRepository";
import { PlaceOnlineOrderUseCase } from "@/src/application/use-cases/storefront/PlaceOnlineOrderUseCase";

function repos(db: Awaited<ReturnType<typeof withTestDb>>["db"]) {
  return {
    shops: new DrizzleShopRepository(db),
    products: new DrizzleProductRepository(db),
    partners: new DrizzlePartnerRepository(db),
    salesOrders: new DrizzleSalesOrderRepository(db),
    onlineOrders: new DrizzleOnlineOrderRepository(db),
    sequences: new DrizzleSequenceRepository(db),
  };
}
const uc = (r: ReturnType<typeof repos>) =>
  new PlaceOnlineOrderUseCase(r.shops, r.products, r.partners, r.salesOrders, r.onlineOrders, r.sequences);

test("สั่งซื้อออนไลน์ → ใบขาย draft + ลูกค้าใหม่ + online order ผูกกัน", async () => {
  const { db, cleanup } = await withTestDb();
  try {
    const shop = await seedShop(db, "alpha", "o@alpha.test");
    const r = repos(db);
    const product = await r.products.create({
      shopId: shop.shopId, sku: "P1", name: "สินค้า", type: "stockable",
      salePrice: 10000, costPrice: 0, taxRateBp: 700, uom: "ชิ้น",
    });

    const order = await uc(r).execute({
      slug: "alpha", customer: { name: "ลูกค้าเว็บ", email: "web@x.com", phone: "0812345678" },
      lines: [{ productId: product.id, qty: 2000 }], orderDate: "2026-06-01T00:00:00Z",
    });
    assert.equal(order.orderNumber, "WEB00001");
    assert.equal(order.totalAmount, 21400);

    // ใบขาย draft มีบรรทัด + ผูกลูกค้า
    const so = await r.salesOrders.findById(shop.shopId, order.salesOrderId);
    assert.ok(so);
    assert.equal(so!.status, "draft");
    assert.equal(so!.lines.length, 1);
    assert.equal(so!.totalAmount, 21400);

    // ลูกค้าถูกสร้างจากอีเมล
    const partner = await r.partners.findByEmail(shop.shopId, "web@x.com");
    assert.ok(partner);
    assert.equal(so!.customerId, partner!.id);

    // สั่งซ้ำอีเมลเดิม → ใช้ลูกค้าเดิม + เลขใหม่
    const order2 = await uc(r).execute({
      slug: "alpha", customer: { name: "ลูกค้าเว็บ", email: "web@x.com" },
      lines: [{ productId: product.id, qty: 1000 }], orderDate: "2026-06-02T00:00:00Z",
    });
    assert.equal(order2.orderNumber, "WEB00002");
    const list = await r.partners.list(shop.shopId, { page: 1, pageSize: 50 });
    assert.equal(list.items.filter((p) => p.email === "web@x.com").length, 1);
  } finally {
    cleanup();
  }
});

test("scope-by-shop: online order ของ A ไม่โผล่ใน B", async () => {
  const { db, cleanup } = await withTestDb();
  try {
    const a = await seedShop(db, "alpha", "o@alpha.test");
    const b = await seedShop(db, "beta", "o@beta.test");
    const r = repos(db);
    const product = await r.products.create({
      shopId: a.shopId, sku: "P1", name: "X", type: "stockable",
      salePrice: 5000, costPrice: 0, taxRateBp: 0, uom: "ชิ้น",
    });
    await uc(r).execute({
      slug: "alpha", customer: { name: "C", email: "c@x.com" },
      lines: [{ productId: product.id, qty: 1000 }], orderDate: "t",
    });
    assert.equal((await r.onlineOrders.list(a.shopId)).length, 1);
    assert.equal((await r.onlineOrders.list(b.shopId)).length, 0);

    // ซื้อสินค้าข้ามร้านไม่ได้ (สินค้าอยู่ shop A, สั่งผ่าน slug beta)
    await assert.rejects(
      () => uc(r).execute({
        slug: "beta", customer: { name: "C", email: "c@x.com" },
        lines: [{ productId: product.id, qty: 1000 }], orderDate: "t",
      }),
      /ไม่พบสินค้า/,
    );
  } finally {
    cleanup();
  }
});
