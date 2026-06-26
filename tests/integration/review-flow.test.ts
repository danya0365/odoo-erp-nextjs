// integration: รีวิวร้าน ผ่าน repo จริง — ส่งรีวิว → สรุปค่าเฉลี่ย + scope
import { test } from "node:test";
import assert from "node:assert/strict";

import { withTestDb } from "@/tests/helpers/withTestDb";
import { seedShop } from "@/tests/helpers/seedShop";
import { DrizzleShopRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleShopRepository";
import { DrizzleStoreReviewRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleStoreReviewRepository";
import { SubmitReviewUseCase } from "@/src/application/use-cases/storefront/SubmitReviewUseCase";
import { ratingSummary } from "@/src/domain/services/review";

function repos(db: Awaited<ReturnType<typeof withTestDb>>["db"]) {
  return {
    shops: new DrizzleShopRepository(db),
    reviews: new DrizzleStoreReviewRepository(db),
  };
}

test("ส่งรีวิวหลายรายการ → ค่าเฉลี่ยถูกต้อง", async () => {
  const { db, cleanup } = await withTestDb();
  try {
    const shop = await seedShop(db, "alpha", "o@alpha.test");
    const r = repos(db);
    const uc = new SubmitReviewUseCase(r.shops, r.reviews);
    await uc.execute({ slug: "alpha", customerName: "A", rating: 5, comment: "ดี" });
    await uc.execute({ slug: "alpha", customerName: "B", rating: 4 });
    await uc.execute({ slug: "alpha", customerName: "C", rating: 4 });

    const ratings = await r.reviews.ratings(shop.shopId);
    const summary = ratingSummary(ratings);
    assert.equal(summary.count, 3);
    assert.equal(summary.averageX10, 43); // (5+4+4)/3 = 4.33 → 4.3
    assert.equal((await r.reviews.listByShop(shop.shopId)).length, 3);
  } finally {
    cleanup();
  }
});

test("คะแนนไม่ถูกต้อง → error (ไม่บันทึก)", async () => {
  const { db, cleanup } = await withTestDb();
  try {
    const shop = await seedShop(db, "alpha", "o@alpha.test");
    const r = repos(db);
    await assert.rejects(
      () => new SubmitReviewUseCase(r.shops, r.reviews).execute({ slug: "alpha", customerName: "A", rating: 9 }),
      /1–5/,
    );
    assert.equal((await r.reviews.listByShop(shop.shopId)).length, 0);
  } finally {
    cleanup();
  }
});

test("scope-by-shop: รีวิวของ A ไม่โผล่ใน B", async () => {
  const { db, cleanup } = await withTestDb();
  try {
    const a = await seedShop(db, "alpha", "o@alpha.test");
    const b = await seedShop(db, "beta", "o@beta.test");
    const r = repos(db);
    await new SubmitReviewUseCase(r.shops, r.reviews).execute({ slug: "alpha", customerName: "A", rating: 5 });
    assert.equal((await r.reviews.listByShop(a.shopId)).length, 1);
    assert.equal((await r.reviews.listByShop(b.shopId)).length, 0);
  } finally {
    cleanup();
  }
});
