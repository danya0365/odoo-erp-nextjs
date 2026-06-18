import { test } from "node:test";
import assert from "node:assert/strict";

import type { Partner } from "@/src/domain/entities";
import type {
  CreatePartnerInput,
  UpdatePartnerInput,
  IPartnerRepository,
} from "@/src/application/repositories/IPartnerRepository";
import type { Page, PageQuery } from "@/src/application/repositories/pagination";
import { CreatePartnerUseCase } from "./CreatePartnerUseCase";
import { UpdatePartnerUseCase } from "./UpdatePartnerUseCase";
import { ArchivePartnerUseCase } from "./ArchivePartnerUseCase";

// fake repo in-memory (พิสูจน์ use case ทำงานโดยไม่แตะ DB)
class FakePartnerRepository implements IPartnerRepository {
  rows: Partner[] = [];
  private seq = 0;

  async create(input: CreatePartnerInput): Promise<Partner> {
    const now = "2026-01-01T00:00:00.000Z";
    const p: Partner = {
      id: `p${++this.seq}`,
      shopId: input.shopId,
      name: input.name,
      type: input.type,
      email: input.email ?? null,
      phone: input.phone ?? null,
      taxId: input.taxId ?? null,
      street: input.street ?? null,
      city: input.city ?? null,
      country: input.country ?? null,
      isCompany: input.isCompany ?? false,
      parentId: input.parentId ?? null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
    this.rows.push(p);
    return p;
  }
  async findById(shopId: string, id: string): Promise<Partner | null> {
    return this.rows.find((r) => r.shopId === shopId && r.id === id) ?? null;
  }
  async findByEmail(shopId: string, email: string): Promise<Partner | null> {
    return this.rows.find((r) => r.shopId === shopId && r.email === email) ?? null;
  }
  async list(shopId: string, q: PageQuery): Promise<Page<Partner>> {
    const items = this.rows.filter((r) => r.shopId === shopId);
    return { items, total: items.length, page: q.page, pageSize: q.pageSize };
  }
  async update(shopId: string, id: string, input: UpdatePartnerInput): Promise<Partner> {
    const p = await this.findById(shopId, id);
    if (!p) throw new Error("not found");
    Object.assign(p, input);
    return p;
  }
  async setActive(shopId: string, id: string, isActive: boolean): Promise<Partner> {
    const p = await this.findById(shopId, id);
    if (!p) throw new Error("not found");
    p.isActive = isActive;
    return p;
  }
}

test("CreatePartnerUseCase: trim ชื่อ + normalize email", async () => {
  const repo = new FakePartnerRepository();
  const uc = new CreatePartnerUseCase(repo);
  const p = await uc.execute({
    shopId: "s1",
    name: "  ร้านลูกค้า ก  ",
    type: "customer",
    email: "  Foo@Example.COM ",
  });
  assert.equal(p.name, "ร้านลูกค้า ก");
  assert.equal(p.email, "foo@example.com");
  assert.equal(p.shopId, "s1");
});

test("CreatePartnerUseCase: ชื่อว่าง → error", async () => {
  const uc = new CreatePartnerUseCase(new FakePartnerRepository());
  await assert.rejects(
    () => uc.execute({ shopId: "s1", name: "   ", type: "customer" }),
    /ระบุชื่อ/,
  );
});

test("UpdatePartnerUseCase: ไม่พบ → error / พบ → อัปเดต", async () => {
  const repo = new FakePartnerRepository();
  const created = await repo.create({ shopId: "s1", name: "เดิม", type: "customer" });
  const uc = new UpdatePartnerUseCase(repo);

  await assert.rejects(() => uc.execute("s1", "ไม่มี", { name: "x" }), /ไม่พบ/);
  // scope: shop อื่นเข้าไม่ถึง
  await assert.rejects(() => uc.execute("s2", created.id, { name: "x" }), /ไม่พบ/);

  const updated = await uc.execute("s1", created.id, { name: " ใหม่ ", type: "both" });
  assert.equal(updated.name, "ใหม่");
  assert.equal(updated.type, "both");
});

test("ArchivePartnerUseCase: ปิดการใช้งาน", async () => {
  const repo = new FakePartnerRepository();
  const created = await repo.create({ shopId: "s1", name: "ก", type: "vendor" });
  const uc = new ArchivePartnerUseCase(repo);
  const archived = await uc.execute("s1", created.id, false);
  assert.equal(archived.isActive, false);
});
