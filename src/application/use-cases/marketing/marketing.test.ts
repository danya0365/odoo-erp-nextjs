import { test } from "node:test";
import assert from "node:assert/strict";

import type { Promotion, LoyaltyAccount, Partner } from "@/src/domain/entities";
import type { CreatePromotionInput, IPromotionRepository, ILoyaltyRepository } from "@/src/application/repositories/IMarketingRepository";
import type { IPartnerRepository } from "@/src/application/repositories/IPartnerRepository";

import { CreatePromotionUseCase, ApplyPromotionUseCase, EarnPointsUseCase, RedeemPointsUseCase } from "./MarketingUseCases";

const NOW = "2026-01-01T00:00:00.000Z";

class FakePromoRepo implements IPromotionRepository {
  promos = new Map<string, Promotion>();
  private seq = 0;
  async create(input: CreatePromotionInput): Promise<Promotion> {
    const p: Promotion = { id: `p${++this.seq}`, isActive: true, createdAt: NOW, ...input };
    this.promos.set(p.code, p);
    return p;
  }
  async findByCode(_s: string, code: string) { return this.promos.get(code) ?? null; }
  async list() { return [...this.promos.values()]; }
  async setActive(_s: string, id: string, isActive: boolean) {
    const p = [...this.promos.values()].find((x) => x.id === id)!;
    p.isActive = isActive;
    return p;
  }
}

class FakeLoyaltyRepo implements ILoyaltyRepository {
  accs = new Map<string, LoyaltyAccount>();
  private seq = 0;
  async getOrCreate(shopId: string, customerId: string): Promise<LoyaltyAccount> {
    let a = this.accs.get(customerId);
    if (!a) { a = { id: `a${++this.seq}`, shopId, customerId, points: 0, updatedAt: NOW }; this.accs.set(customerId, a); }
    return a;
  }
  async addPoints(shopId: string, customerId: string, delta: number): Promise<LoyaltyAccount> {
    const a = await this.getOrCreate(shopId, customerId);
    a.points += delta;
    return a;
  }
  async list() { return [...this.accs.values()]; }
}

class FakePartnerRepo implements IPartnerRepository {
  p: Partner = { id: "c1", shopId: "s1", name: "ลูกค้า", type: "customer", email: null, phone: null, taxId: null, street: null, city: null, country: null, isCompany: false, creditTermDays: null, parentId: null, isActive: true, createdAt: NOW, updatedAt: NOW };
  async create() { return this.p; }
  async findById(_s: string, id: string) { return id === this.p.id ? this.p : null; }
  async findByEmail() { return null; }
  async list() { return { items: [this.p], total: 1, page: 1, pageSize: 20 }; }
  async update() { return this.p; }
  async setActive() { return this.p; }
}

test("CreatePromotion: code → uppercase + กันซ้ำ + เปอร์เซ็นต์ ≤100", async () => {
  const promos = new FakePromoRepo();
  const uc = new CreatePromotionUseCase(promos);
  const p = await uc.execute("s1", "save10", "ลด 10%", "percent", 10, 50000);
  assert.equal(p.code, "SAVE10");
  await assert.rejects(() => uc.execute("s1", "save10", "", "percent", 5, 0), /มีโค้ดนี้แล้ว/);
  await assert.rejects(() => uc.execute("s1", "BIG", "", "percent", 150, 0), /ไม่เกิน 100/);
});

test("ApplyPromotion: เข้าเงื่อนไข → คิดส่วนลด; ต่ำกว่าขั้นต่ำ → ไม่ลด", async () => {
  const promos = new FakePromoRepo();
  await new CreatePromotionUseCase(promos).execute("s1", "SAVE10", "", "percent", 10, 50000);
  const apply = new ApplyPromotionUseCase(promos);
  const ok = await apply.execute("s1", "save10", 100000);
  assert.equal(ok.eligible, true);
  assert.equal(ok.discount, 10000);
  assert.equal(ok.total, 90000);
  const low = await apply.execute("s1", "SAVE10", 40000);
  assert.equal(low.eligible, false);
  assert.equal(low.discount, 0);
  await assert.rejects(() => apply.execute("s1", "NOPE", 1000), /ไม่พบโค้ด/);
});

test("Earn + Redeem: สะสมจากยอด, แลกกันแต้มติดลบ", async () => {
  const loyalty = new FakeLoyaltyRepo();
  const earn = new EarnPointsUseCase(loyalty, new FakePartnerRepo());
  const acc = await earn.execute("s1", "c1", 25000, 10000); // 250 บาท → 2 แต้ม
  assert.equal(acc.points, 2);
  // ยอดต่ำเกินไป → error
  await assert.rejects(() => earn.execute("s1", "c1", 5000, 10000), /ยังไม่ถึงเกณฑ์/);

  const redeem = new RedeemPointsUseCase(loyalty);
  const after = await redeem.execute("s1", "c1", 2);
  assert.equal(after.points, 0);
  await assert.rejects(() => redeem.execute("s1", "c1", 5), /แต้มไม่พอ/);
});
