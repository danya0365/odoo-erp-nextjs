import { test } from "node:test";
import assert from "node:assert/strict";

import type { Shop, StoreReview } from "@/src/domain/entities";
import type { IShopRepository } from "@/src/application/repositories/IShopRepository";
import type {
  CreateReviewInput,
  IStoreReviewRepository,
} from "@/src/application/repositories/IStoreReviewRepository";
import { SubmitReviewUseCase } from "./SubmitReviewUseCase";

const shop = (active = true): Shop => ({
  id: "shop1", name: "ร้าน", slug: "demo", isActive: active, createdAt: "t", updatedAt: "t",
});

class FakeShops implements IShopRepository {
  constructor(private readonly s: Shop | null) {}
  async create(): Promise<Shop> { return shop(); }
  async findById() { return this.s; }
  async findBySlug() { return this.s; }
}
class FakeReviews implements IStoreReviewRepository {
  store: StoreReview[] = [];
  async create(input: CreateReviewInput): Promise<StoreReview> {
    const r: StoreReview = { id: "r1", createdAt: "t", comment: input.comment ?? null, ...input };
    this.store.push(r);
    return r;
  }
  async listByShop() { return [...this.store]; }
  async ratings() { return this.store.map((r) => r.rating); }
}

test("SubmitReview: บันทึกรีวิว + trim ค่า", async () => {
  const reviews = new FakeReviews();
  const r = await new SubmitReviewUseCase(new FakeShops(shop()), reviews).execute({
    slug: "demo", customerName: "  ลูกค้า  ", rating: 5, comment: "  ดีมาก  ",
  });
  assert.equal(r.customerName, "ลูกค้า");
  assert.equal(r.rating, 5);
  assert.equal(r.comment, "ดีมาก");
  assert.equal(reviews.store.length, 1);
});

test("SubmitReview: คะแนนนอกช่วง 1–5 → error", async () => {
  await assert.rejects(
    () => new SubmitReviewUseCase(new FakeShops(shop()), new FakeReviews()).execute({ slug: "demo", customerName: "A", rating: 0 }),
    /1–5/,
  );
  await assert.rejects(
    () => new SubmitReviewUseCase(new FakeShops(shop()), new FakeReviews()).execute({ slug: "demo", customerName: "A", rating: 6 }),
    /1–5/,
  );
});

test("SubmitReview: ชื่อว่าง → error", async () => {
  await assert.rejects(
    () => new SubmitReviewUseCase(new FakeShops(shop()), new FakeReviews()).execute({ slug: "demo", customerName: " ", rating: 5 }),
    /ระบุชื่อ/,
  );
});

test("SubmitReview: ร้านปิด/ไม่พบ → error", async () => {
  await assert.rejects(
    () => new SubmitReviewUseCase(new FakeShops(null), new FakeReviews()).execute({ slug: "x", customerName: "A", rating: 5 }),
    /ไม่พบร้าน/,
  );
});
