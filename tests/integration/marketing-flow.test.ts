// integration: โปรโมชั่น + แต้มสะสม ผ่าน repo จริง
import { test } from "node:test";
import assert from "node:assert/strict";

import { withTestDb } from "@/tests/helpers/withTestDb";
import { seedShop } from "@/tests/helpers/seedShop";
import { DrizzlePromotionRepository, DrizzleLoyaltyRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleMarketingRepository";
import { DrizzlePartnerRepository } from "@/src/infrastructure/repositories/drizzle/DrizzlePartnerRepository";
import { CreatePromotionUseCase, ApplyPromotionUseCase, EarnPointsUseCase, RedeemPointsUseCase } from "@/src/application/use-cases/marketing/MarketingUseCases";

test("โปรโมชั่น + แต้ม: สร้าง → คิดส่วนลด → สะสม/แลก (scope-by-shop)", async () => {
  const { db, cleanup } = await withTestDb();
  try {
    const a = await seedShop(db, "alpha", "o@alpha.test");
    const b = await seedShop(db, "beta", "o@beta.test");
    const promos = new DrizzlePromotionRepository(db);
    const loyalty = new DrizzleLoyaltyRepository(db);
    const partners = new DrizzlePartnerRepository(db);
    const cust = await partners.create({ shopId: a.shopId, name: "ลูกค้า", type: "customer" });

    await new CreatePromotionUseCase(promos).execute(a.shopId, "SAVE10", "ลด 10%", "percent", 10, 50000);
    const res = await new ApplyPromotionUseCase(promos).execute(a.shopId, "save10", 100000);
    assert.equal(res.discount, 10000);
    assert.equal(res.total, 90000);

    // scope: shop B ไม่เห็นโค้ดของ A
    await assert.rejects(() => new ApplyPromotionUseCase(promos).execute(b.shopId, "SAVE10", 100000), /ไม่พบโค้ด/);

    // แต้ม: ซื้อ 300 บาท → 3 แต้ม → แลก 1
    const earned = await new EarnPointsUseCase(loyalty, partners).execute(a.shopId, cust.id, 30000, 10000);
    assert.equal(earned.points, 3);
    const after = await new RedeemPointsUseCase(loyalty).execute(a.shopId, cust.id, 1);
    assert.equal(after.points, 2);
    assert.equal((await loyalty.list(a.shopId)).length, 1);
    assert.equal((await loyalty.list(b.shopId)).length, 0);
  } finally {
    cleanup();
  }
});
