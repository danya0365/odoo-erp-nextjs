// integration: CRM pipeline ผ่าน repo จริง — create/move/convert (cross-module SO) + scope-by-shop
import { test } from "node:test";
import assert from "node:assert/strict";

import { withTestDb } from "@/tests/helpers/withTestDb";
import { seedShop } from "@/tests/helpers/seedShop";
import { DrizzleCrmStageRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleCrmStageRepository";
import { DrizzleOpportunityRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleOpportunityRepository";
import { DrizzleSalesOrderRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleSalesOrderRepository";
import { DrizzlePartnerRepository } from "@/src/infrastructure/repositories/drizzle/DrizzlePartnerRepository";
import { CreateOpportunityUseCase } from "@/src/application/use-cases/crm/CreateOpportunityUseCase";
import { MoveStageUseCase } from "@/src/application/use-cases/crm/MoveStageUseCase";
import { ConvertToQuotationUseCase } from "@/src/application/use-cases/crm/ConvertToQuotationUseCase";

function repos(db: Awaited<ReturnType<typeof withTestDb>>["db"]) {
  return {
    stages: new DrizzleCrmStageRepository(db),
    opps: new DrizzleOpportunityRepository(db),
    salesOrders: new DrizzleSalesOrderRepository(db),
    partners: new DrizzlePartnerRepository(db),
  };
}

const NOW = "2026-01-01T00:00:00.000Z";

test("create → move เข้าสเตจชนะ → won, default pipeline 4 สเตจ", async () => {
  const { db, cleanup } = await withTestDb();
  try {
    const shop = await seedShop(db, "alpha", "o@alpha.test");
    const r = repos(db);
    const opp = await new CreateOpportunityUseCase(r.stages, r.opps).execute({
      shopId: shop.shopId, name: "ดีลใหญ่", expectedRevenue: 500000, probability: 30,
    });
    const stages = await r.stages.list(shop.shopId);
    assert.equal(stages.length, 4);
    assert.equal(opp.stageId, stages[0].id); // สเตจแรก
    assert.equal(opp.status, "active");

    const won = stages.find((s) => s.isWon)!;
    const moved = await new MoveStageUseCase(r.stages, r.opps).execute(shop.shopId, opp.id, won.id);
    assert.equal(moved.status, "won");
    assert.equal(moved.probability, 100);
  } finally {
    cleanup();
  }
});

test("convert → สร้างใบเสนอราคา draft จริง + ผูก salesOrderId (cross-module)", async () => {
  const { db, cleanup } = await withTestDb();
  try {
    const shop = await seedShop(db, "alpha", "o@alpha.test");
    const r = repos(db);
    const cust = await r.partners.create({ shopId: shop.shopId, name: "ลูกค้า", type: "customer" });
    const opp = await new CreateOpportunityUseCase(r.stages, r.opps).execute({
      shopId: shop.shopId, name: "ดีล", partnerId: cust.id, expectedRevenue: 1000, probability: 50,
    });

    const order = await new ConvertToQuotationUseCase(r.opps, r.salesOrders, r.stages).execute(
      shop.shopId, opp.id, NOW,
    );
    const so = await r.salesOrders.findById(shop.shopId, order.id);
    assert.ok(so);
    assert.equal(so!.customerId, cust.id);
    assert.equal(so!.status, "draft");

    const updated = await r.opps.findById(shop.shopId, opp.id);
    assert.equal(updated!.salesOrderId, order.id);
    assert.equal(updated!.status, "won");

    // แปลงซ้ำไม่ได้
    await assert.rejects(
      () => new ConvertToQuotationUseCase(r.opps, r.salesOrders, r.stages).execute(shop.shopId, opp.id, NOW),
      /แปลงเป็นใบเสนอราคาไปแล้ว/,
    );
  } finally {
    cleanup();
  }
});

test("scope-by-shop: opportunity ของ A ไม่โผล่ใน listAll ของ B", async () => {
  const { db, cleanup } = await withTestDb();
  try {
    const a = await seedShop(db, "alpha", "o@alpha.test");
    const b = await seedShop(db, "beta", "o@beta.test");
    const r = repos(db);
    await new CreateOpportunityUseCase(r.stages, r.opps).execute({
      shopId: a.shopId, name: "ของ A", expectedRevenue: 100, probability: 10,
    });
    const listA = await r.opps.listAll(a.shopId);
    const listB = await r.opps.listAll(b.shopId);
    assert.equal(listA.length, 1);
    assert.equal(listB.length, 0);

    // สเตจของแต่ละ shop แยกกัน
    const stagesA = await r.stages.ensureDefaults(a.shopId);
    const stagesB = await r.stages.ensureDefaults(b.shopId);
    assert.equal(stagesA.length, 4);
    assert.equal(stagesB.length, 4);
    assert.equal(stagesA.some((s) => stagesB.find((x) => x.id === s.id)), false);
  } finally {
    cleanup();
  }
});
